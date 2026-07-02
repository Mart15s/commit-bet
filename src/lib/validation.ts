import { z } from "zod";

export const projectPlanSchema = z.object({
  phases: z.array(z.object({ name: z.string(), description: z.string() })),
  deliverables: z.array(z.string()),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      assigned_user_id: z.string().uuid(),
      assigned_reason: z.string(),
      priority: z.enum(["low", "medium", "high", "critical"]),
      due_date: z.string(),
      acceptance_criteria: z.array(z.string()).min(1),
      expected_evidence_types: z.array(z.string()).min(1),
    }),
  ),
  risks: z.array(z.string()),
  minimum_success_version: z.string(),
  ambitious_success_version: z.string(),
});

export const disputeRecommendationSchema = z.object({
  neutral_summary: z.string(),
  arguments_for_approval: z.array(z.string()),
  arguments_for_rejection: z.array(z.string()),
  missing_information: z.array(z.string()),
  recommended_resolution: z.enum([
    "approve",
    "reject",
    "partial_credit",
    "needs_changes",
    "extend_deadline",
    "manual_review",
  ]),
  confidence_score: z.number().min(0).max(100),
  suggested_next_action: z.string(),
});

export const finalReportSchema = z.object({
  project_summary: z.string(),
  success_criteria_evaluation: z.array(
    z.object({
      criterion: z.string(),
      status: z.enum(["met", "partially_met", "not_met", "unclear"]),
      comment: z.string(),
    }),
  ),
  task_statistics: z.object({
    planned: z.number(),
    approved: z.number(),
    rejected: z.number(),
    disputed: z.number(),
    late: z.number(),
  }),
  member_contributions: z.array(
    z.object({
      user_id: z.string().uuid(),
      contribution_score: z.number().min(0).max(100),
      summary: z.string(),
      strongest_evidence: z.array(z.string()),
      issues: z.array(z.string()),
    }),
  ),
  evidence_quality_score: z.number().min(0).max(100),
  delay_analysis: z.string(),
  dispute_summary: z.string(),
  pledge_recommendation: z.array(
    z.object({
      user_id: z.string().uuid(),
      pledge_return_percentage: z.number().min(0).max(100),
      reason: z.string(),
    }),
  ),
  reasoning: z.string(),
  confidence_score: z.number().min(0).max(100),
  human_confirmation_required: z.literal(true),
});

export type ProjectPlan = z.infer<typeof projectPlanSchema>;
export type DisputeRecommendation = z.infer<typeof disputeRecommendationSchema>;
export type FinalReport = z.infer<typeof finalReportSchema>;

const trimmedList = z
  .array(z.string())
  .transform((items) => [
    ...new Map(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLocaleLowerCase(), item] as const),
    ).values(),
  ]);

export const evidenceSchema = z.object({
  taskId: z.string().uuid(),
  type: z.enum(["screenshot", "document", "github", "video", "link", "demo", "other"]),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().min(2),
});

export const reviewSchema = z
  .object({
    taskId: z.string().uuid(),
    status: z.enum(["approved", "needs_changes", "rejected"]),
    comment: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.status !== "approved" && !value.comment.trim()) {
      ctx.addIssue({ code: "custom", path: ["comment"], message: "A comment is required." });
    }
  });

export const projectBasicsSchema = z
  .object({
    teamId: z.string().uuid(),
    projectType: z.string().trim().min(2).max(120),
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(2).max(2000),
    goal: z.string().trim().min(2).max(1000),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    selectedSuccessCriteria: trimmedList,
    customSuccessCriteria: trimmedList,
    criteria: z.array(z.string().trim().min(2).max(500)).min(1, "Choose at least one success criterion.").max(20),
    memberIds: z.array(z.string().uuid()).min(1).max(5),
    pledgeAmount: z.number().finite().min(0).max(1_000_000),
    pledgeAmountIsCustom: z.boolean(),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date.",
  });

export const projectMemberSetupSchema = z.object({
  memberId: z.string().uuid(),
  roles: trimmedList,
  strengths: trimmedList,
  weaknesses: trimmedList,
  availabilityMinutesPerDay: z.number().int().min(15).max(1440),
  preferredWorkTypes: trimmedList,
  evidenceTypes: trimmedList,
  experienceLevel: z.string().trim().min(2).max(80),
  bestWorkTime: z.string().trim().min(2).max(80),
  notes: z.string().max(1000),
  customNotes: z.string().max(1000),
  pledgeAmount: z.number().finite().min(0).max(1_000_000),
  pledgeCurrency: z.enum(["POINTS", "EUR_DECLARED"]),
}).refine((value) => value.roles.length > 0 || value.strengths.length > 0, {
  path: ["roles"],
  message: "Choose at least one role or strength for every member.",
});
