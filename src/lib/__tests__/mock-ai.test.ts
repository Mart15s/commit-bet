import { describe, expect, it } from "vitest";
import { mockFinalReport, mockProjectPlan } from "@/lib/ai/mock";
import {
  enhancedTextSchema,
  evidenceReviewSchema,
  finalReportSchema,
  projectPlanSchema,
} from "@/lib/ai/schemas";

const members = [
  { user_id: "11111111-1111-4111-8111-111111111111", name: "Martynas", strengths: ["backend"], availability_minutes_per_day: 120 },
  { user_id: "22222222-2222-4222-8222-222222222222", name: "Jonas", strengths: ["design"], availability_minutes_per_day: 90 },
];

describe("mock AI", () => {
  it("generates a valid project plan with concrete tasks", () => {
    const plan = mockProjectPlan({
      title: "Build a landing page",
      goal: "Collect waitlist signups",
      successCriteria: ["Landing page online", "Waitlist form stores data"],
      startDate: "2026-06-12",
      endDate: "2026-06-18",
      members,
    });
    expect(() => projectPlanSchema.parse(plan)).not.toThrow();
    expect(plan.tasks).toHaveLength(3);
    expect(plan.tasks.every((task) => task.acceptanceCriteria.length > 0)).toBe(true);
    expect(plan.tasks.every((task) => task.expectedEvidenceTypes.length > 0)).toBe(true);
  });

  it("generates a final report that requires human confirmation", () => {
    const report = mockFinalReport({
      title: "Build a landing page",
      successCriteria: ["Landing page online"],
      tasks: [{ status: "approved", due_date: "2026-06-18" }],
      members: [{ user_id: members[0].user_id, name: "Martynas", approved: 1, evidence: 2 }],
      disputeCount: 0,
    });
    expect(() => finalReportSchema.parse(report)).not.toThrow();
    expect(report.humanConfirmationNotice).toContain("recommendation");
  });

  it("rejects invalid Gemini JSON shapes", () => {
    expect(() => enhancedTextSchema.parse({ enhancedText: "", language: "en" })).toThrow();
    expect(() => evidenceReviewSchema.parse({ recommendedStatus: "approve" })).toThrow();
    expect(() => projectPlanSchema.parse({ tasks: [] })).toThrow();
  });
});
