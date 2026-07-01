import "server-only";

import type { z } from "zod";
import { AiError, normalizeAiError, normalizeProviderError, shouldTryFallbackModel, type NormalizedAiError } from "@/lib/ai/errors";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-2.5-flash-lite";

type StructuredOptions<T> = {
  schema: z.ZodType<T>;
  schemaName: string;
  prompt: string;
  input: unknown;
  fetcher?: typeof fetch;
};

export type GeminiStructuredResult<T> = {
  output: T;
  model: string;
  fallbackUsed: boolean;
  attempts: string[];
};

export async function generateGeminiStructured<T>({
  schema,
  schemaName,
  prompt,
  input,
  fetcher = fetch,
}: StructuredOptions<T>): Promise<GeminiStructuredResult<T>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiError("missing_api_key");

  const primaryModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL;
  const attempts: string[] = [];

  try {
    attempts.push(primaryModel);
    return {
      output: await callGeminiModel({ apiKey, model: primaryModel, schema, schemaName, prompt, input, fetcher }),
      model: primaryModel,
      fallbackUsed: false,
      attempts,
    };
  } catch (error) {
    const normalized = normalizeAiError(error);
    if (fallbackModel !== primaryModel && shouldTryFallbackModel(normalized)) {
      attempts.push(fallbackModel);
      return {
        output: await callGeminiModel({ apiKey, model: fallbackModel, schema, schemaName, prompt, input, fetcher }),
        model: fallbackModel,
        fallbackUsed: true,
        attempts,
      };
    }
    throw error;
  }
}

async function callGeminiModel<T>({
  apiKey,
  model,
  schema,
  schemaName,
  prompt,
  input,
  fetcher,
}: StructuredOptions<T> & {
  apiKey: string;
  model: string;
  fetcher: typeof fetch;
}) {
  const first = await requestGemini({ apiKey, model, schemaName, prompt, input, fetcher });
  const parsed = parseAndValidate(first, schema);
  if (parsed.ok) return parsed.output;

  const repairPrompt = [
    prompt,
    `The previous ${schemaName} response was not valid JSON for CommitBet's schema.`,
    "Return one corrected JSON object only. No markdown, comments, or extra text.",
  ].join(" ");
  const repaired = await requestGemini({ apiKey, model, schemaName, prompt: repairPrompt, input, fetcher });
  const repairedParsed = parseAndValidate(repaired, schema);
  if (repairedParsed.ok) return repairedParsed.output;

  throw new AiError("invalid_ai_output", { cause: repairedParsed.error });
}

async function requestGemini({
  apiKey,
  model,
  schemaName,
  prompt,
  input,
  fetcher,
}: {
  apiKey: string;
  model: string;
  schemaName: string;
  prompt: string;
  input: unknown;
  fetcher: typeof fetch;
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetcher(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                prompt,
                `JSON schema name: ${schemaName}.`,
                "Input snapshot:",
                JSON.stringify(input),
              ].join("\n\n"),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  const payload = await readResponsePayload(response);
  if (!response.ok) throw normalizeProviderError(response.status, payload);
  return extractText(payload);
}

function parseAndValidate<T>(text: string, schema: z.ZodType<T>) {
  try {
    const parsed = JSON.parse(stripJsonFence(text));
    const result = schema.safeParse(parsed);
    if (result.success) return { ok: true as const, output: result.data };
    return { ok: false as const, error: result.error };
  } catch (error) {
    return { ok: false as const, error };
  }
}

function stripJsonFence(text: string) {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

async function readResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractText(payload: unknown) {
  if (!payload || typeof payload !== "object") throw new AiError("invalid_ai_output");
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  const text = candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text).filter(Boolean).join("\n");
  if (!text) throw new AiError("invalid_ai_output");
  return text;
}

export function logAiFailure(context: Record<string, unknown>, error: NormalizedAiError) {
  console.error("CommitBet AI fallback used", {
    ...context,
    error: {
      code: error.code,
      retryable: error.retryable,
      status: error.status,
    },
  });
}
