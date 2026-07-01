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
    return error.message || "Gemini request failed.";
  }
  return "Gemini request failed.";
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
  const response = await getGeminiClient().models.generateContent({
    model,
    contents: JSON.stringify(input),
    config: {
      systemInstruction,
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(schema),
    },
  });
  const text = response.text;
  if (!text) throw new AIResponseError("Gemini returned no text output.");
  const output = schema.parse(parseJson(text));
  return { output, model: response.modelVersion || model };
}
