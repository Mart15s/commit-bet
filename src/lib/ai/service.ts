import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  disputeRecommendationSchema,
  finalReportSchema,
  projectPlanSchema,
  type DisputeRecommendation,
  type FinalReport,
  type ProjectPlan,
} from "@/lib/validation";
import {
  mockDisputeRecommendation,
  mockFinalReport,
  mockProjectPlan,
} from "@/lib/ai/mock";

const useMock = !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER !== "openai";

async function structured<T>(
  schema: typeof projectPlanSchema | typeof disputeRecommendationSchema | typeof finalReportSchema,
  name: string,
  instructions: string,
  input: unknown,
) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    store: false,
    instructions,
    input: JSON.stringify(input),
    text: { format: zodTextFormat(schema, name) },
  });
  if (!response.output_parsed) throw new Error("AI returned no structured output.");
  return response.output_parsed as T;
}

export async function generateProjectPlan(
  input: Parameters<typeof mockProjectPlan>[0],
): Promise<ProjectPlan> {
  if (useMock) return mockProjectPlan(input);
  return structured<ProjectPlan>(
    projectPlanSchema,
    "project_plan",
    "You are an accountability project planner. Create fewer meaningful tasks, assign by strengths and availability, and require clear acceptance criteria and evidence.",
    input,
  );
}

export async function generateDisputeRecommendation(
  input: Parameters<typeof mockDisputeRecommendation>[0],
): Promise<DisputeRecommendation> {
  if (useMock) return mockDisputeRecommendation(input);
  return structured<DisputeRecommendation>(
    disputeRecommendationSchema,
    "dispute_recommendation",
    "Act as a neutral mediator. Give a recommendation only. Never make a financial decision and explain uncertainty.",
    input,
  );
}

export async function generateFinalReport(
  input: Parameters<typeof mockFinalReport>[0],
): Promise<FinalReport> {
  if (useMock) return mockFinalReport(input);
  return structured<FinalReport>(
    finalReportSchema,
    "final_report",
    "Audit the project evidence neutrally. Give pledge recommendations only, require human confirmation, and do not claim legal authority.",
    input,
  );
}

