export type Sprint = {
  id: string;
  title: string;
  goal: string;
  status: string;
  start_date: string;
  end_date: string;
};
export type WorkspaceTask = {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string;
  task_assignments: Array<{ user_id: string }> | null;
};
export type WorkspaceEvidence = {
  id: string;
  task_id: string;
  description: string;
  type: string;
  created_at: string;
};
export type WorkspacePledge = {
  project_id: string;
  user_id: string;
  amount: number | string;
  currency: string;
};

export function dashboardMetrics(
  projects: Sprint[],
  tasks: WorkspaceTask[],
  pledges: WorkspacePledge[],
  userId: string,
  today: string,
) {
  const active = projects.filter((p) => p.status === "active");
  const activeIds = new Set(active.map((p) => p.id));
  const activeTasks = tasks.filter((task) => activeIds.has(task.project_id));
  const assigned = (task: WorkspaceTask) =>
    task.task_assignments?.some(
      (assignment) => assignment.user_id === userId,
    ) ?? false;
  const rank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const queue = activeTasks
    .filter((t) => assigned(t) && t.status !== "approved")
    .sort(
      (a, b) =>
        (a.due_date || "9999").localeCompare(b.due_date || "9999") ||
        (rank[a.priority] ?? 4) - (rank[b.priority] ?? 4),
    );
  // Never offer review for any task assigned to the current user.
  const reviews = activeTasks.filter(
    (t) => t.status === "submitted" && !assigned(t),
  );
  const points = pledges
    .filter(
      (p) =>
        activeIds.has(p.project_id) &&
        p.user_id === userId &&
        p.currency === "POINTS",
    )
    .reduce(
      (sum, p) =>
        sum + (Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0),
      0,
    );
  return {
    active,
    queue,
    reviews,
    todayCount: queue.filter(
      (t) => t.due_date === today && t.status !== "submitted",
    ).length,
    points,
  };
}
