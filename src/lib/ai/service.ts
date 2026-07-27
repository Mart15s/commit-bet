import "server-only";

import { generateGeminiObject, getGeminiModel, isGeminiConfigured } from "@/lib/ai/gemini";
import {
  disputePrompt,
  evidenceReviewPrompt,
  finalReportPrompt,
  projectPlanPrompt,
} from "@/lib/ai/prompts";
import {
  disputeRecommendationSchema,
  evidenceReviewSchema,
  finalReportSchema,
  projectPlanSchema,
  type DisputeRecommendation,
  type EvidenceReview,
  type FinalReport,
  type ProjectPlan,
} from "@/lib/validation";
import {
  mockDisputeRecommendation,
  mockFinalReport,
  mockProjectPlan,
} from "@/lib/ai/mock";

const useMock =
  process.env.AI_PROVIDER === "mock"
  || process.env.NODE_ENV === "test";

export function getAIProviderMetadata() {
  if (useMock) {
    return { provider: "mock", model: "mock-v1" } as const;
  }
  return {
    provider: "gemini",
    model: getGeminiModel(),
  } as const;
}

export async function generateProjectPlan(
  input: Parameters<typeof mockProjectPlan>[0],
): Promise<ProjectPlan> {
  if (useMock) return mockProjectPlan(input);
  return generateGeminiObject({
    schema: projectPlanSchema,
    instruction: projectPlanPrompt,
    input,
    maxOutputTokens: 16_384,
  });
}

export async function generateDisputeRecommendation(
  input: Parameters<typeof mockDisputeRecommendation>[0],
): Promise<DisputeRecommendation> {
  if (useMock) return mockDisputeRecommendation(input);
  return generateGeminiObject({
    schema: disputeRecommendationSchema,
    instruction: disputePrompt,
    input,
    maxOutputTokens: 8_192,
  });
}

export async function reviewEvidence(input: unknown): Promise<EvidenceReview> {
  if (useMock) {
    return {
      recommendation: "needs_changes",
      criteria_met: [],
      criteria_not_proven: ["Automated tests do not inspect uploaded file content."],
      reasoning: "Deterministic test recommendation; a human reviewer must inspect the evidence.",
      confidence: 40,
      signals_used: ["Evidence metadata supplied to the test provider"],
      human_review_required: true,
    };
  }
  return generateGeminiObject({
    schema: evidenceReviewSchema,
    instruction: evidenceReviewPrompt,
    input,
    maxOutputTokens: 8_192,
  });
}

export async function generateFinalReport(
  input: Parameters<typeof mockFinalReport>[0],
): Promise<FinalReport> {
  if (useMock) return mockFinalReport(input);
  return generateGeminiObject({
    schema: finalReportSchema,
    instruction: finalReportPrompt,
    input,
    maxOutputTokens: 16_384,
  });
}

export function assertProductionAIConfigured() {
  if (!useMock && !isGeminiConfigured()) {
    throw new Error("Gemini is not configured for this deployment.");
  }
}
