import { describe, expect, it } from "vitest";
import {
  dashboardMetrics,
  type Sprint,
  type WorkspaceTask,
} from "@/lib/dashboard";
const projects: Sprint[] = [
  {
    id: "active",
    title: "Sprint",
    goal: "Ship",
    status: "active",
    start_date: "2026-10-20",
    end_date: "2026-10-26",
  },
  {
    id: "done",
    title: "Finished",
    goal: "Done",
    status: "completed",
    start_date: "2026-10-01",
    end_date: "2026-10-07",
  },
];
function task(
  id: string,
  overrides: Partial<WorkspaceTask> = {},
): WorkspaceTask {
  return {
    id,
    project_id: "active",
    title: id,
    status: "todo",
    priority: "medium",
    due_date: "2026-10-24",
    task_assignments: [{ user_id: "me" }],
    ...overrides,
  };
}
describe("truthful dashboard metrics", () => {
  it("returns honest zero values for a workspace without projects", () => {
    expect(dashboardMetrics([], [], [], "me", "2026-10-24")).toEqual({
      active: [],
      queue: [],
      reviews: [],
      todayCount: 0,
      points: 0,
    });
  });
  it("counts only actionable assigned tasks due today in active sprints", () => {
    const tasks = [
      task("today"),
      task("future", { due_date: "2026-10-25" }),
      task("overdue", { due_date: "2026-10-23" }),
      task("approved", { status: "approved" }),
      task("review", { status: "submitted" }),
      task("completed-sprint", { project_id: "done" }),
      task("other", { task_assignments: [{ user_id: "other" }] }),
    ];
    const result = dashboardMetrics(projects, tasks, [], "me", "2026-10-24");
    expect(result.todayCount).toBe(1);
    expect(result.queue.map((t) => t.id)).toEqual([
      "overdue",
      "today",
      "review",
      "future",
    ]);
  });
  it("excludes self-review even when the user is not the first assignee", () => {
    const tasks = [
      task("own", {
        status: "submitted",
        task_assignments: [{ user_id: "other" }, { user_id: "me" }],
      }),
      task("peer", {
        status: "submitted",
        task_assignments: [{ user_id: "other" }],
      }),
    ];
    expect(
      dashboardMetrics(projects, tasks, [], "me", "2026-10-24").reviews.map(
        (t) => t.id,
      ),
    ).toEqual(["peer"]);
  });
  it("sums only genuine POINTS commitments owned by this user in active sprints", () => {
    const pledges = [
      { project_id: "active", user_id: "me", currency: "POINTS", amount: 0 },
      { project_id: "active", user_id: "me", currency: "EUR", amount: 900 },
      { project_id: "done", user_id: "me", currency: "POINTS", amount: 20 },
      {
        project_id: "active",
        user_id: "other",
        currency: "POINTS",
        amount: 30,
      },
    ];
    expect(
      dashboardMetrics(projects, [], pledges, "me", "2026-10-24").points,
    ).toBe(0);
  });
});
