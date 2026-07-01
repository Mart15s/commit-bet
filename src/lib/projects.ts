export type ProjectFilter = "all" | "draft" | "active" | "completed";

export const projectFilters: ProjectFilter[] = ["all", "draft", "active", "completed"];

export function isProjectFilter(value: unknown): value is ProjectFilter {
  return typeof value === "string" && projectFilters.includes(value as ProjectFilter);
}

export function projectDisplayStatus(projectStatus: string, tasks: Array<{ status: string }> = []) {
  if (tasks.some((task) => task.status === "disputed")) return "disputed";
  return projectStatus;
}

export function projectSuccessScore(tasks: Array<{ status: string }> = []) {
  if (!tasks.length) return 0;
  const approved = tasks.filter((task) => task.status === "approved").length;
  const submitted = tasks.filter((task) => task.status === "submitted").length;
  return Math.min(100, Math.round((approved / tasks.length) * 100) + submitted * 4);
}

export function daysRemaining(endDate: string, now = new Date()) {
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}
