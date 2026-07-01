import "server-only";

import { generateJson } from "@/lib/ai/gemini";
import {
  disputePrompt,
  enhanceTextPrompt,
  evidenceReviewPrompt,
  finalReportPrompt,
  projectPlanPrompt,
} from "@/lib/ai/prompts";
import {
  disputeRecommendationSchema,
  enhancedTextSchema,
  evidenceReviewSchema,
  finalReportSchema,
  projectPlanSchema,
  type DisputeRecommendation,
  type EnhancedText,
  type EvidenceReview,
  type FinalReport,
  type ProjectPlan,
} from "@/lib/ai/schemas";

export async function enhanceText(input: unknown): Promise<{ output: EnhancedText; model: string }> {
  return generateJson({
    schema: enhancedTextSchema,
    systemInstruction: enhanceTextPrompt,
    input,
    temperature: 0.35,
    maxOutputTokens: 2048,
  });
}

export async function generateProjectPlan(input: unknown): Promise<{ output: ProjectPlan; model: string }> {
  return generateJson({
    schema: projectPlanSchema,
    systemInstruction: projectPlanPrompt,
    input,
    maxOutputTokens: 16_384,
  });
}

export async function reviewEvidence(input: unknown): Promise<{ output: EvidenceReview; model: string }> {
  return generateJson({
    schema: evidenceReviewSchema,
    systemInstruction: evidenceReviewPrompt,
    input,
    maxOutputTokens: 8192,
  });
}

export async function generateDisputeRecommendation(input: unknown): Promise<{ output: DisputeRecommendation; model: string }> {
  return generateJson({
    schema: disputeRecommendationSchema,
    systemInstruction: disputePrompt,
    input,
    maxOutputTokens: 8192,
  });
}

export async function generateFinalReport(input: unknown): Promise<{ output: FinalReport; model: string }> {
  return generateJson({
    schema: finalReportSchema,
    systemInstruction: finalReportPrompt,
    input,
    maxOutputTokens: 16_384,
  });
}
