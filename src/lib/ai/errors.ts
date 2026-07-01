export type AiErrorCode =
  | "missing_api_key"
  | "model_overloaded"
  | "rate_limited"
  | "model_not_found"
  | "invalid_ai_output"
  | "provider_unavailable"
  | "unknown_ai_error";

export type NormalizedAiError = {
  code: AiErrorCode;
  message: string;
  retryable: boolean;
  userAction: string;
  status?: number;
};

const copy: Record<AiErrorCode, Omit<NormalizedAiError, "code" | "status">> = {
  missing_api_key: {
    message: "AI is not configured for this environment. Add GEMINI_API_KEY in Vercel and redeploy.",
    retryable: false,
    userAction: "Add GEMINI_API_KEY in Vercel, redeploy, then retry the AI action.",
  },
  model_overloaded: {
    message: "AI is temporarily overloaded. You can retry now, use the fallback draft, or continue manually.",
    retryable: true,
    userAction: "Retry the AI action, or continue with the fallback draft/manual review.",
  },
  rate_limited: {
    message: "AI usage limit was reached. Please wait a moment and try again.",
    retryable: true,
    userAction: "Wait briefly, then retry. The current project data is safe.",
  },
  model_not_found: {
    message: "The configured Gemini model is unavailable. Use gemini-2.5-flash or gemini-2.5-flash-lite.",
    retryable: false,
    userAction: "Update GEMINI_MODEL or GEMINI_FALLBACK_MODEL in Vercel and redeploy.",
  },
  invalid_ai_output: {
    message: "AI returned an unexpected format. The app kept your project data safe; please retry.",
    retryable: true,
    userAction: "Retry the AI action. CommitBet will keep using a safe fallback if the response is still invalid.",
  },
  provider_unavailable: {
    message: "AI is temporarily unavailable. You can retry, use the fallback draft, or continue manually.",
    retryable: true,
    userAction: "Retry the AI action, or continue manually until the provider recovers.",
  },
  unknown_ai_error: {
    message: "AI could not complete the request. The app kept your project data safe.",
    retryable: true,
    userAction: "Retry the AI action, or continue manually from the saved project state.",
  },
};

export class AiError extends Error {
  code: AiErrorCode;
  retryable: boolean;
  userAction: string;
  status?: number;

  constructor(code: AiErrorCode, details?: { status?: number; message?: string; cause?: unknown }) {
    const normalized = copy[code];
    super(details?.message ?? normalized.message, { cause: details?.cause });
    this.name = "AiError";
    this.code = code;
    this.retryable = normalized.retryable;
    this.userAction = normalized.userAction;
    this.status = details?.status;
  }
}

export function normalizeAiError(error: unknown): NormalizedAiError {
  if (error instanceof AiError) {
    return {
      code: error.code,
      message: copy[error.code].message,
      retryable: error.retryable,
      userAction: error.userAction,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    const provider = classifyProviderError(undefined, error.message);
    return {
      code: provider,
      ...copy[provider],
    };
  }

  return {
    code: "unknown_ai_error",
    ...copy.unknown_ai_error,
  };
}

export function normalizeProviderError(status: number, payload: unknown): AiError {
  const message = extractProviderMessage(payload);
  return new AiError(classifyProviderError(status, message), { status, message });
}

export function classifyProviderError(status?: number, message = ""): AiErrorCode {
  const lower = message.toLowerCase();

  if (status === 401 || status === 403 || lower.includes("api key")) return "missing_api_key";
  if (status === 429 || lower.includes("rate limit") || lower.includes("quota")) return "rate_limited";
  if (status === 404 || lower.includes("not found") || lower.includes("is not found")) return "model_not_found";
  if (
    lower.includes("high demand")
    || lower.includes("overloaded")
    || lower.includes("model is currently experiencing")
    || lower.includes("model unavailable")
  ) {
    return "model_overloaded";
  }
  if (status === 503 || status === 502 || status === 500 || lower.includes("unavailable")) return "provider_unavailable";
  return "unknown_ai_error";
}

export function aiErrorResponse(error: unknown) {
  return {
    ok: false as const,
    error: normalizeAiError(error),
  };
}

export function shouldTryFallbackModel(error: NormalizedAiError) {
  return (
    error.code === "model_overloaded"
    || error.code === "rate_limited"
    || error.code === "provider_unavailable"
    || error.code === "model_not_found"
  );
}

function extractProviderMessage(payload: unknown) {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    const maybeError = "error" in payload ? (payload as { error?: unknown }).error : payload;
    if (maybeError && typeof maybeError === "object" && "message" in maybeError) {
      return String((maybeError as { message?: unknown }).message ?? "");
    }
  }
  return "";
}
