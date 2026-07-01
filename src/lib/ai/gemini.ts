import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z, type ZodType } from "zod";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

let client: GoogleGenAI | null = null;

export class AIConfigurationError extends Error {
  constructor(message = "Gemini API key is not configured.") {
    super(message);
    this.name = "AIConfigurationError";
  }
}

export class AIResponseError extends Error {
  constructor(message = "AI returned an invalid response.") {
    super(message);
    this.name = "AIResponseError";
  }
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIConfigurationError();
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match?.[1]) throw new AIResponseError("AI response was not valid JSON.");
    return JSON.parse(match[1]);
  }
}

export function normalizeAIError(error: unknown) {
  if (error instanceof AIConfigurationError || error instanceof AIResponseError) {
    return error.message;
  }
  if (error instanceof z.ZodError) {
    return "AI returned JSON that did not match the expected schema.";
  }
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { error?: { message?: string; status?: string } };
      if (parsed.error?.status === "INVALID_ARGUMENT") {
        return "Gemini rejected the structured request. Please try again.";
      }
      return parsed.error?.message || error.message || "Gemini request failed.";
    } catch {
      // Fall through to the original message.
    }
    return error.message || "Gemini request failed.";
  }
  return "Gemini request failed.";
}

function toGeminiJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toGeminiJsonSchema);
  if (!value || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    if (
      key === "$schema"
      || key === "pattern"
      || key === "minLength"
      || key === "maxLength"
      || key === "default"
      || key === "examples"
    ) {
      continue;
    }
    if (key === "format" && !["date", "date-time", "time"].includes(String(child))) {
      continue;
    }
    result[key] = toGeminiJsonSchema(child);
  }
  return result;
}

function isInvalidArgumentError(error: unknown) {
  if (!(error instanceof Error)) return false;
  try {
    const parsed = JSON.parse(error.message) as { error?: { status?: string; code?: number } };
    return parsed.error?.status === "INVALID_ARGUMENT" || parsed.error?.code === 400;
  } catch {
    return /INVALID_ARGUMENT|invalid argument/i.test(error.message);
  }
}

export async function generateJson<T>({
  schema,
  systemInstruction,
  input,
  temperature = 0.2,
  maxOutputTokens = 8192,
}: {
  schema: ZodType<T>;
  systemInstruction: string;
  input: unknown;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<{ output: T; model: string }> {
  const model = getGeminiModel();
  const jsonSchema = toGeminiJsonSchema(z.toJSONSchema(schema));
  const contents = [
    "Input JSON:",
    JSON.stringify(input),
    "Return only JSON matching this JSON schema:",
    JSON.stringify(jsonSchema),
  ].join("\n\n");
  const request = {
    model,
    contents,
    config: {
      systemInstruction,
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
    },
  };
  let response;
  try {
    response = await getGeminiClient().models.generateContent(request);
  } catch (error) {
    if (!isInvalidArgumentError(error)) throw error;
    response = await getGeminiClient().models.generateContent({
      ...request,
      config: {
        ...request.config,
        responseJsonSchema: undefined,
      },
    });
  }
  const text = response.text;
  if (!text) throw new AIResponseError("Gemini returned no text output.");
  const output = schema.parse(parseJson(text));
  return { output, model: response.modelVersion || model };
}
