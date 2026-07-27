import { z } from "zod";

const aiPlanText = (maximumLength: number) =>
  z.string().trim().min(1).max(maximumLength);

export const projectPlanSchema = z
  .object({
    phases: z
      .array(
        z.object({
          name: aiPlanText(120),
          description: aiPlanText(2000),
        }).strict(),
      )
      .max(20),
    deliverables: z.array(aiPlanText(500)).max(50),
    tasks: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(120),
          description: aiPlanText(4000),
          assigned_user_id: z.string().uuid(),
          assigned_reason: aiPlanText(2000),
          priority: z.enum(["low", "medium", "high", "critical"]),
          due_date: z.iso.date(),
          acceptance_criteria: z.array(aiPlanText(500)).min(1).max(20),
          expected_evidence_types: z.array(aiPlanText(120)).min(1).max(20),
        }).strict(),
      )
      .min(1)
      .max(50),
    risks: z.array(aiPlanText(1000)).max(50),
    minimum_success_version: aiPlanText(4000),
    ambitious_success_version: aiPlanText(4000),
  })
  .strict()
  .superRefine((plan, ctx) => {
    const titles = plan.tasks.map((task) => task.title.toLocaleLowerCase());
    if (new Set(titles).size !== titles.length) {
      ctx.addIssue({
        code: "custom",
        path: ["tasks"],
        message: "AI task titles must be unique.",
      });
    }
  });

export const aiPlanReplacementResultSchema = z.object({
  project_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
  ai_report_id: z.string().uuid(),
  task_ids: z.array(z.string().uuid()).min(1).max(50),
  task_count: z.number().int().min(1).max(50),
  replayed: z.boolean(),
}).strict();

export const projectPlanActionRequestSchema = z.object({
  projectId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export const MAX_DAILY_LOG_PAYLOAD_BYTES = 65_536;
export const MAX_DAILY_LOG_TASKS = 50;
export const MAX_DAILY_LOG_PROOF_LINKS = 20;

const dailyLogText = (minimumLength: number, maximumLength: number) =>
  z.string().trim().min(minimumLength).max(maximumLength);

const httpProofLinkSchema = z
  .string()
  .trim()
  .min(10)
  .max(2048)
  .transform((value, ctx) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        ctx.addIssue({
          code: "custom",
          message: "Proof links must use http or https.",
        });
        return z.NEVER;
      }
      return parsed.href;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Proof links must be valid full URLs.",
      });
      return z.NEVER;
    }
  });

export const dailyLogInputSchema = z
  .object({
    projectId: z.string().uuid(),
    logDate: z.iso.date(),
    summary: dailyLogText(1, 4000),
    timeSpentMinutes: z.number().int().min(0).max(1440),
    blockers: dailyLogText(0, 4000),
    nextSteps: dailyLogText(1, 4000),
    taskIds: z.array(z.string().uuid()).max(MAX_DAILY_LOG_TASKS),
    proofLinks: z
      .array(httpProofLinkSchema)
      .max(MAX_DAILY_LOG_PROOF_LINKS),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.logDate > new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({
        code: "custom",
        path: ["logDate"],
        message: "Daily logs cannot be dated in the future.",
      });
    }
    if (new Set(value.taskIds).size !== value.taskIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["taskIds"],
        message: "Selected tasks must be unique.",
      });
    }
    if (new Set(value.proofLinks).size !== value.proofLinks.length) {
      ctx.addIssue({
        code: "custom",
        path: ["proofLinks"],
        message: "Proof links must be unique.",
      });
    }
    if (value.proofLinks.length > 0 && value.taskIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["taskIds"],
        message: "Choose at least one task before adding proof links.",
      });
    }
  });

export const dailyLogSaveResultSchema = z
  .object({
    daily_log_id: z.string().uuid(),
    project_id: z.string().uuid(),
    log_date: z.iso.date(),
    task_count: z.number().int().min(0).max(MAX_DAILY_LOG_TASKS),
    proof_link_count: z
      .number()
      .int()
      .min(0)
      .max(MAX_DAILY_LOG_PROOF_LINKS),
    evidence_count: z
      .number()
      .int()
      .min(0)
      .max(MAX_DAILY_LOG_TASKS * MAX_DAILY_LOG_PROOF_LINKS),
    replayed: z.boolean(),
  })
  .strict();

export const disputeRecommendationSchema = z
  .object({
    neutral_summary: aiPlanText(4000),
    arguments_for_approval: z.array(aiPlanText(1000)).max(20),
    arguments_for_rejection: z.array(aiPlanText(1000)).max(20),
    missing_information: z.array(aiPlanText(1000)).max(20),
    recommended_resolution: z.enum([
      "approve",
      "reject",
      "partial_credit",
      "needs_changes",
      "extend_deadline",
      "manual_review",
    ]),
    confidence_score: z.number().min(0).max(100),
    suggested_next_action: aiPlanText(2000),
  })
  .strict();

export const evidenceReviewSchema = z
  .object({
    recommendation: z.enum(["approve", "needs_changes", "reject"]),
    criteria_met: z.array(aiPlanText(500)).max(20),
    criteria_not_proven: z.array(aiPlanText(500)).max(20),
    reasoning: aiPlanText(4000),
    confidence: z.number().min(0).max(100),
    signals_used: z.array(aiPlanText(500)).max(20),
    human_review_required: z.literal(true),
  })
  .strict();

export const finalReportSchema = z
  .object({
    project_summary: aiPlanText(8000),
    success_criteria_evaluation: z
      .array(
        z
          .object({
            criterion: aiPlanText(1000),
            status: z.enum(["met", "partially_met", "not_met", "unclear"]),
            comment: aiPlanText(4000),
          })
          .strict(),
      )
      .max(50),
    task_statistics: z
      .object({
        planned: z.number().int().nonnegative().max(10_000),
        approved: z.number().int().nonnegative().max(10_000),
        rejected: z.number().int().nonnegative().max(10_000),
        disputed: z.number().int().nonnegative().max(10_000),
        late: z.number().int().nonnegative().max(10_000),
      })
      .strict(),
    member_contributions: z
      .array(
        z
          .object({
            user_id: z.string().uuid(),
            contribution_score: z.number().min(0).max(100),
            summary: aiPlanText(4000),
            strongest_evidence: z.array(aiPlanText(1000)).max(20),
            issues: z.array(aiPlanText(1000)).max(20),
          })
          .strict(),
      )
      .max(5),
    evidence_quality_score: z.number().min(0).max(100),
    delay_analysis: aiPlanText(8000),
    dispute_summary: aiPlanText(8000),
    pledge_recommendation: z
      .array(
        z
          .object({
            user_id: z.string().uuid(),
            pledge_return_percentage: z.number().min(0).max(100),
            reason: aiPlanText(4000),
          })
          .strict(),
      )
      .max(5),
    reasoning: aiPlanText(12_000),
    confidence_score: z.number().min(0).max(100),
    human_confirmation_required: z.literal(true),
  })
  .strict();

export type ProjectPlan = z.infer<typeof projectPlanSchema>;
export type DisputeRecommendation = z.infer<typeof disputeRecommendationSchema>;
export type EvidenceReview = z.infer<typeof evidenceReviewSchema>;
export type FinalReport = z.infer<typeof finalReportSchema>;

const finalDecisionMemberActionSchema = z
  .object({
    userId: z.string().uuid(),
    returnPercentage: z.number().finite().min(0).max(100),
  })
  .strict();

export const projectFinalizationInputSchema = z
  .object({
    projectId: z.string().uuid(),
    finalReportId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
    humanConfirmation: z.literal(true),
    confirmationNote: z.string().trim().max(2000),
    memberActions: z.array(finalDecisionMemberActionSchema).min(1).max(5),
  })
  .strict()
  .superRefine((value, ctx) => {
    const memberIds = value.memberActions.map((action) => action.userId);
    if (new Set(memberIds).size !== memberIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["memberActions"],
        message: "Every project member can appear only once.",
      });
    }
  });

export const projectFinalizationResultSchema = z
  .object({
    project_id: z.string().uuid(),
    final_report_id: z.string().uuid(),
    final_decision_id: z.string().uuid(),
    confirmed_by: z.string().uuid(),
    confirmed_at: z.iso.datetime({ offset: true }),
    pledge_count: z.number().int().min(1).max(5),
    project_status: z.literal("completed"),
    replayed: z.boolean(),
  })
  .strict();

export const taskTransitionSchema = z.object({
  taskId: z.string().uuid(),
});

export const draftTaskUpdateSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  dueDate: z.iso.date(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedUserId: z.string().uuid(),
});

export const disputeResolutionSchema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.enum(["approve", "needs_changes", "reject"]),
});

const trimmedList = (maximumItems: number, maximumValueLength: number) =>
  z
    .array(z.string().max(maximumValueLength))
    .max(maximumItems)
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
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    }, "Evidence links must use http:// or https://."),
  description: z.string().trim().min(2).max(2000),
});

export const evidenceDeleteSchema = z.object({
  evidenceId: z.string().uuid(),
  confirmed: z.literal(true),
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

export const projectMemberSetupSchema = z.object({
  memberId: z.string().uuid(),
  roles: trimmedList(20, 120),
  strengths: trimmedList(20, 120),
  weaknesses: trimmedList(20, 120),
  availabilityMinutesPerDay: z.number().int().min(15).max(1440),
  preferredWorkTypes: trimmedList(20, 120),
  evidenceTypes: trimmedList(20, 120),
  experienceLevel: z.string().trim().min(2).max(80),
  bestWorkTime: z.string().trim().min(2).max(80),
  notes: z.string().max(1000),
  customNotes: z.string().max(1000),
  pledgeAmount: z.number().finite().min(0).max(1_000_000).multipleOf(0.01),
  pledgeCurrency: z.literal("POINTS"),
}).refine((value) => value.roles.length > 0 || value.strengths.length > 0, {
  path: ["roles"],
  message: "Choose at least one role or strength for every member.",
});

export const projectCreationSchema = z
  .object({
    requestId: z.string().uuid(),
    teamId: z.string().uuid(),
    projectType: z.string().trim().min(2).max(120),
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(2).max(2000),
    goal: z.string().trim().min(2).max(1000),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    selectedSuccessCriteria: trimmedList(20, 500),
    customSuccessCriteria: trimmedList(20, 500),
    memberSetups: z.array(projectMemberSetupSchema).min(1).max(5),
    pledgeAmount: z.number().finite().min(0).max(1_000_000).multipleOf(0.01),
    pledgeAmountIsCustom: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
    }

    const criteria = [
      ...value.selectedSuccessCriteria,
      ...value.customSuccessCriteria,
    ];
    if (criteria.length < 1 || criteria.length > 20) {
      ctx.addIssue({
        code: "custom",
        path: ["selectedSuccessCriteria"],
        message: "Choose between 1 and 20 success criteria.",
      });
    }
    if (
      new Set(criteria.map((criterion) => criterion.toLocaleLowerCase())).size
      !== criteria.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customSuccessCriteria"],
        message: "Success criteria must be unique.",
      });
    }

    const memberIds = value.memberSetups.map((member) => member.memberId);
    if (new Set(memberIds).size !== memberIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["memberSetups"],
        message: "Project members must be unique.",
      });
    }
    for (const [index, member] of value.memberSetups.entries()) {
      if (member.pledgeAmount !== value.pledgeAmount) {
        ctx.addIssue({
          code: "custom",
          path: ["memberSetups", index, "pledgeAmount"],
          message: "Every member pledge must match the project pledge.",
        });
      }
    }
  });

export type ProjectCreationInput = z.infer<typeof projectCreationSchema>;
