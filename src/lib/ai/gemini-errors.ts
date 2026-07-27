export type GeminiErrorCategory =
  | "configuration"
  | "invalid_response"
  | "schema_validation"
  | "request_or_schema"
  | "authentication_or_permission"
  | "quota_or_rate_limit"
  | "model_or_endpoint"
  | "provider_transient"
  | "timeout"
  | "transport"
  | "unknown";

export type GeminiFailure = {
  httpStatus?: number;
  category: GeminiErrorCategory;
};

type ErrorRecord = {
  name?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  cause?: unknown;
};

function asErrorRecord(error: unknown): ErrorRecord | undefined {
  return typeof error === "object" && error !== null
    ? error as ErrorRecord
    : undefined;
}

function httpStatus(error: unknown) {
  const record = asErrorRecord(error);
  const directStatus = record?.status ?? record?.statusCode;
  if (
    typeof directStatus === "number"
    && Number.isInteger(directStatus)
    && directStatus >= 100
    && directStatus <= 599
  ) {
    return directStatus;
  }

  const cause = asErrorRecord(record?.cause);
  const causeStatus = cause?.status ?? cause?.statusCode;
  return (
    typeof causeStatus === "number"
    && Number.isInteger(causeStatus)
    && causeStatus >= 100
    && causeStatus <= 599
  )
    ? causeStatus
    : undefined;
}

export function classifyGeminiError(error: unknown): GeminiFailure {
  const record = asErrorRecord(error);
  const status = httpStatus(error);
  const name = typeof record?.name === "string" ? record.name : "";
  const code = typeof record?.code === "string" ? record.code : "";

  if (name === "AIConfigurationError") {
    return { category: "configuration" };
  }
  if (name === "AIResponseError") {
    return { category: "invalid_response" };
  }
  if (name === "ZodError") {
    return { category: "schema_validation" };
  }
  if (
    name === "AbortError"
    || name === "TimeoutError"
    || code === "ETIMEDOUT"
  ) {
    return { httpStatus: status, category: "timeout" };
  }
  if (status === 400) {
    return { httpStatus: status, category: "request_or_schema" };
  }
  if (status === 401 || status === 403) {
    return { httpStatus: status, category: "authentication_or_permission" };
  }
  if (status === 404) {
    return { httpStatus: status, category: "model_or_endpoint" };
  }
  if (status === 429) {
    return { httpStatus: status, category: "quota_or_rate_limit" };
  }
  if (status !== undefined && status >= 500) {
    return { httpStatus: status, category: "provider_transient" };
  }
  if (name === "TypeError") {
    return { httpStatus: status, category: "transport" };
  }
  return { httpStatus: status, category: "unknown" };
}

export function geminiRetryDelayMs(error: unknown, retryIndex: number) {
  const failure = classifyGeminiError(error);
  const rateLimited = failure.httpStatus === 429;
  const retryable = rateLimited
    || (
      failure.httpStatus !== undefined
      && failure.httpStatus >= 500
      && failure.httpStatus <= 599
    )
    || failure.category === "timeout";

  if (!retryable || retryIndex < 0 || retryIndex > 1) return null;

  // Gemini rate-limit windows can outlive sub-second transport retries. Keep
  // the retry count bounded, but give a 429 enough time to cross a short quota
  // window. Transient provider and timeout failures retain the faster backoff.
  const baseDelayMs = rateLimited ? 10_000 : 500;
  return baseDelayMs * (2 ** retryIndex);
}

const SUPPORTED_SCHEMA_KEYS = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  // Omit maxItems: Gemini rejects CommitBet's combined array bounds as too
  // complex. The original Zod schema still enforces every maximum at runtime.
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
  "propertyOrdering",
]);

const SUPPORTED_STRING_FORMATS = new Set(["date", "date-time", "time"]);

function sanitizeSchemaValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeSchemaValue);
  if (typeof value !== "object" || value === null) return value;

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(source)) {
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) continue;
    if (
      key === "format"
      && (
        typeof child !== "string"
        || !SUPPORTED_STRING_FORMATS.has(child)
      )
    ) {
      continue;
    }
    if (key === "properties" || key === "$defs") {
      if (typeof child !== "object" || child === null || Array.isArray(child)) {
        continue;
      }
      result[key] = Object.fromEntries(
        Object.entries(child as Record<string, unknown>)
          .map(([propertyName, propertySchema]) => [
            propertyName,
            sanitizeSchemaValue(propertySchema),
          ]),
      );
      continue;
    }
    result[key] = sanitizeSchemaValue(child);
  }

  if (
    result.type === "object"
    && typeof result.properties === "object"
    && result.properties !== null
    && !Array.isArray(result.properties)
    && result.propertyOrdering === undefined
  ) {
    result.propertyOrdering = Object.keys(
      result.properties as Record<string, unknown>,
    );
  }

  return result;
}

export function toGeminiJsonSchema(schema: unknown) {
  return sanitizeSchemaValue(schema);
}
