import { z } from "zod";
export {
  disputeRecommendationSchema,
  enhancedTextSchema,
  enhanceTextInputSchema,
  evidenceReviewSchema,
  finalReportSchema,
  projectPlanSchema,
  type DisputeRecommendation,
  type EnhancedText,
  type EvidenceReview,
  type FinalReport,
  type ProjectPlan,
} from "@/lib/ai/schemas";

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
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(2).max(2000),
    goal: z.string().trim().min(2).max(1000),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    criteria: z.array(z.string().trim().min(2).max(500)).min(1).max(20),
    memberIds: z.array(z.string().uuid()).min(1).max(5),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date.",
  });

export const projectMemberSetupSchema = z.object({
  memberId: z.string().uuid(),
  strengths: z.array(z.string().min(1)).min(1),
  weaknesses: z.array(z.string().min(1)),
  availabilityMinutesPerDay: z.number().int().min(15).max(1440),
  preferredWorkTypes: z.array(z.string().min(1)),
  notes: z.string().max(1000),
  pledgeAmount: z.number().finite().min(0).max(1_000_000),
  pledgeCurrency: z.enum(["POINTS", "EUR_DECLARED"]),
});
