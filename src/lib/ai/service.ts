import "server-only";

import type { z } from "zod";
import { normalizeAiError, type NormalizedAiError } from "@/lib/ai/errors";
import { generateGeminiStructured, logAiFailure } from "@/lib/ai/gemini";
import { disputeRecommendationPrompt, finalReportPrompt, projectPlanPrompt } from "@/lib/ai/prompts";
import {
  disputeRecommendationSchema,
  finalReportSchema,
  projectPlanSchema,
  type DisputeRecommendation,
  type FinalReport,
  type ProjectPlan,
} from "@/lib/ai/schemas";
import {
  mockDisputeRecommendation,
  mockFinalReport,
  mockProjectPlan,
} from "@/lib/ai/mock";

export type AiGeneration<T> = {
  output: T;
  model: string;
  fallbackUsed: boolean;
  error?: NormalizedAiError;
};

type FallbackMetadata = {
  fallback_used: true;
  fallback_label: string;
  ai_error: NormalizedAiError;
};

function withFallbackMetadata<T extends object>(
  output: T,
  fallbackLabel: string,
  error: NormalizedAiError,
): T & FallbackMetadata {
  return {
    ...output,
    fallback_used: true,
    fallback_label: fallbackLabel,
    ai_error: error,
  };
}

async function generateOrFallback<T extends object>({
  schema,
  schemaName,
  prompt,
  input,
  fallbackLabel,
  fallback,
}: {
  schema: z.ZodType<T>;
  schemaName: string;
  prompt: string;
  input: unknown;
  fallbackLabel: string;
  fallback: () => T;
}): Promise<AiGeneration<T>> {
  try {
    const result = await generateGeminiStructured<T>({
      schema,
      schemaName,
      prompt,
      input,
    });
    return {
      output: result.output,
      model: result.model,
      fallbackUsed: result.fallbackUsed,
    };
  } catch (error) {
    const normalized = normalizeAiError(error);
    logAiFailure({ schemaName }, normalized);
    return {
      output: withFallbackMetadata(fallback(), fallbackLabel, normalized),
      model: "deterministic-fallback",
      fallbackUsed: true,
      error: normalized,
    };
  }
}

export async function generateProjectPlan(
  input: Parameters<typeof mockProjectPlan>[0],
): Promise<AiGeneration<ProjectPlan>> {
  return generateOrFallback<ProjectPlan>({
    schema: projectPlanSchema,
    schemaName: "project_plan",
    prompt: projectPlanPrompt,
    input,
    fallbackLabel: "Fallback draft - AI was unavailable",
    fallback: () => mockProjectPlan(input),
  });
}

export async function generateDisputeRecommendation(
  input: Parameters<typeof mockDisputeRecommendation>[0],
): Promise<AiGeneration<DisputeRecommendation>> {
  return generateOrFallback<DisputeRecommendation>({
    schema: disputeRecommendationSchema,
    schemaName: "dispute_recommendation",
    prompt: disputeRecommendationPrompt,
    input,
    fallbackLabel: "Manual dispute review - AI unavailable",
    fallback: () => ({
      ...mockDisputeRecommendation(input),
      suggested_next_action: "Resolve manually after comparing the performer explanation, reviewer reason, and submitted evidence.",
      missing_information: [
        ...mockDisputeRecommendation(input).missing_information,
        "AI recommendation is unavailable; use human review options.",
      ],
    }),
  });
}

export async function generateFinalReport(
  input: Parameters<typeof mockFinalReport>[0],
): Promise<AiGeneration<FinalReport>> {
  return generateOrFallback<FinalReport>({
    schema: finalReportSchema,
    schemaName: "final_report",
    prompt: finalReportPrompt,
    input,
    fallbackLabel: "Basic report - AI analysis unavailable",
    fallback: () => ({
      ...mockFinalReport(input),
      project_summary: `Basic report - AI analysis unavailable. ${mockFinalReport(input).project_summary}`,
      reasoning: "This basic report is generated from task counts, evidence counts, dispute counts, member contribution signals, and virtual pledge totals. Human confirmation is required.",
    }),
  });
}
