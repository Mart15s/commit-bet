import { z } from "zod";

export const evidenceTypeSchema = z.enum([
  "screenshot",
  "document",
  "github",
  "video",
  "link",
  "demo",
  "other",
]);

export const aiLanguageSchema = z.enum(["en", "lt"]);

export const enhanceTextContextSchema = z.enum([
  "project_description",
  "project_goal",
  "success_criteria",
  "task_description",
  "daily_log",
  "evidence_description",
]);

export const enhancedTextSchema = z.object({
  enhancedText: z.string().min(1).max(4000),
  suggestions: z.array(z.string().min(1).max(300)).max(5).optional(),
  language: aiLanguageSchema,
});

export const enhanceTextInputSchema = z.object({
  text: z.string().trim().min(2).max(4000),
  context: enhanceTextContextSchema,
  language: aiLanguageSchema.optional().default("en"),
});

export const projectPlanSchema = z.object({
  planSummary: z.string().min(1),
  phases: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })).min(1),
  dailyGoals: z.array(z.object({
    date: z.iso.date(),
    goal: z.string().min(1),
    focus: z.string().min(1),
  })).min(1),
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      acceptanceCriteria: z.array(z.string().min(1)).min(1),
      expectedEvidenceTypes: z.array(evidenceTypeSchema).min(1),
      priority: z.enum(["low", "medium", "high", "critical"]),
      complexity: z.enum(["low", "medium", "high"]),
      dueDate: z.iso.date(),
      assignedUserId: z.string().uuid(),
      assignmentReason: z.string().min(1),
      estimatedMinutes: z.number().int().min(15).max(100_000),
      dependencies: z.array(z.string().min(1)).optional(),
      successImpact: z.string().min(1),
    }),
  ).min(1).max(60),
  risks: z.array(z.object({
    risk: z.string().min(1),
    mitigation: z.string().min(1),
    severity: z.enum(["low", "medium", "high"]),
  })),
  minimumSuccessVersion: z.string().min(1),
  ambitiousSuccessVersion: z.string().min(1),
});

export const evidenceReviewSchema = z.object({
  evidenceSummary: z.string().min(1),
  matchedTask: z.boolean(),
  criteria: z.array(z.object({
    criterion: z.string().min(1),
    status: z.enum(["met", "partially_met", "not_proven"]),
    reasoning: z.string().min(1),
  })),
  evidenceQualityScore: z.number().min(0).max(100),
  recommendedStatus: z.enum(["approve", "needs_changes", "reject", "disputed"]),
  missingProof: z.array(z.string().min(1)),
  reasoning: z.string().min(1),
  confidence: z.number().min(0).max(100),
  suggestedNextAction: z.string().min(1),
});

export const disputeRecommendationSchema = z.object({
  neutralSummary: z.string().min(1),
  argumentsForApproval: z.array(z.string().min(1)),
  argumentsForRejection: z.array(z.string().min(1)),
  missingInformation: z.array(z.string().min(1)),
  recommendedResolution: z.enum([
    "approve",
    "reject",
    "needs_changes",
    "partial_credit",
    "extend_deadline",
    "manual_review",
  ]),
  confidence: z.number().min(0).max(100),
  suggestedNextAction: z.string().min(1),
  reasoning: z.string().min(1),
});

export const finalReportSchema = z.object({
  projectSummary: z.string().min(1),
  successCriteriaEvaluation: z.array(
    z.object({
      criterion: z.string().min(1),
      status: z.enum(["achieved", "partially_achieved", "not_achieved", "unclear"]),
      reasoning: z.string().min(1),
    }),
  ),
  taskStatistics: z.object({
    total: z.number().int().min(0),
    approved: z.number().int().min(0),
    rejected: z.number().int().min(0),
    needsChanges: z.number().int().min(0),
    disputed: z.number().int().min(0),
    overdue: z.number().int().min(0),
  }),
  memberContributions: z.array(
    z.object({
      userId: z.string().uuid(),
      contributionScore: z.number().min(0).max(100),
      strengthsObserved: z.array(z.string().min(1)),
      issues: z.array(z.string().min(1)),
      evidenceQuality: z.number().min(0).max(100),
      consistency: z.number().min(0).max(100),
      reasoning: z.string().min(1),
      pledgeRecommendation: z.object({
        recommendedReturnPercentage: z.number().min(0).max(100),
        reasoning: z.string().min(1),
      }),
    }),
  ),
  evidenceQualityAnalysis: z.string().min(1),
  delayAnalysis: z.string().min(1),
  disputeSummary: z.string().min(1),
  finalRecommendation: z.string().min(1),
  projectSuccessScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  humanConfirmationNotice: z.string().min(1),
});

export type EnhancedText = z.infer<typeof enhancedTextSchema>;
export type EnhanceTextInput = z.infer<typeof enhanceTextInputSchema>;
export type ProjectPlan = z.infer<typeof projectPlanSchema>;
export type EvidenceReview = z.infer<typeof evidenceReviewSchema>;
export type DisputeRecommendation = z.infer<typeof disputeRecommendationSchema>;
export type FinalReport = z.infer<typeof finalReportSchema>;
