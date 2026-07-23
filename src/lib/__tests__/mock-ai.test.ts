import { describe, expect, it } from "vitest";
import { mockFinalReport, mockProjectPlan } from "@/lib/ai/mock";
import { finalReportSchema, projectPlanSchema } from "@/lib/validation";

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
    expect(plan.tasks.every((task) => task.acceptance_criteria.length > 0)).toBe(true);
  });

  it("generates a final report that requires human confirmation", () => {
    const report = mockFinalReport({
      project: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "Build a landing page",
        description: "A landing page",
        goal: "Collect signups",
        project_type: "Software",
        success_criteria: ["Landing page online"],
        start_date: "2026-06-12",
        end_date: "2026-06-18",
      },
      generated_at: "2026-06-18T12:00:00.000Z",
      task_statistics: {
        planned: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        disputed: 0,
        late: 0,
      },
      evidence_statistics: { total: 0, tasks_with_evidence: 0 },
      review_statistics: {
        total: 0,
        approved: 0,
        needs_changes: 0,
        rejected: 0,
      },
      dispute_statistics: { total: 0, open: 0, resolved: 0, escalated: 0 },
      daily_log_statistics: { total: 0, total_time_spent_minutes: 0 },
      members: [],
      tasks: [],
      assignments: [],
      evidence: [],
      reviews: [],
      disputes: [],
      daily_logs: [],
      daily_log_tasks: [],
      pledges: [],
    });
    expect(() => finalReportSchema.parse(report)).not.toThrow();
    expect(report.human_confirmation_required).toBe(true);
  });
});
