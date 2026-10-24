"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseDailyLog, type DailyLogState } from "@/lib/daily-log";

export async function saveDailyLog(
  _previous: DailyLogState,
  formData: FormData,
): Promise<DailyLogState> {
  const { supabase, user } = await requireUser();
  const parsed = parseDailyLog(formData);
  if (!parsed.success)
    return {
      error: parsed.error.issues.some(
        (issue) => issue.message === "log.linkError",
      )
        ? "log.linkError"
        : "log.validation",
    };
  const {
    projectId,
    logDate,
    summary,
    minutes,
    blockers,
    nextSteps,
    taskIds,
    evidenceLink,
  } = parsed.data;
  let persisted = false;
  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", projectId)
      .single();
    if (projectError || project?.status !== "active")
      return { error: "log.validation" };
    // Validate every selected task and ownership before writing anything.
    if (taskIds.length) {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("id, task_assignments(user_id)")
        .eq("project_id", projectId)
        .in("id", taskIds);
      if (
        error ||
        tasks?.length !== taskIds.length ||
        tasks.some(
          (task) =>
            !task.task_assignments.some(
              (assignment: { user_id: string }) =>
                assignment.user_id === user.id,
            ),
        )
      )
        return { error: "log.taskError" };
    }
    const { data: log, error } = await supabase
      .from("daily_logs")
      .upsert(
        {
          project_id: projectId,
          user_id: user.id,
          log_date: logDate,
          summary,
          time_spent_minutes: minutes,
          blockers,
          next_steps: nextSteps,
        },
        { onConflict: "project_id,user_id,log_date" },
      )
      .select("id")
      .single();
    if (error || !log) return { error: "log.saveError" };
    persisted = true;
    // Upsert first so a recoverable failure never removes previously linked tasks.
    if (taskIds.length) {
      const { error } = await supabase.from("daily_log_tasks").upsert(
        taskIds.map((taskId) => ({ daily_log_id: log.id, task_id: taskId })),
        { onConflict: "daily_log_id,task_id" },
      );
      if (error) return { error: "log.partialError" };
    }
    const removal = supabase
      .from("daily_log_tasks")
      .delete()
      .eq("daily_log_id", log.id);
    const { error: removalError } = await (taskIds.length
      ? removal.not("task_id", "in", `(${taskIds.join(",")})`)
      : removal);
    if (removalError) return { error: "log.partialError" };
    if (evidenceLink && taskIds.length) {
      const { data: existing, error: lookupError } = await supabase
        .from("evidence")
        .select("task_id")
        .eq("user_id", user.id)
        .eq("url", evidenceLink)
        .contains("metadata", { daily_log_id: log.id })
        .in("task_id", taskIds);
      if (lookupError) return { error: "log.partialError" };
      const missing = taskIds.filter(
        (id) => !existing?.some((item) => item.task_id === id),
      );
      if (missing.length) {
        const host = new URL(evidenceLink).hostname;
        const type =
          host === "github.com" || host.endsWith(".github.com")
            ? "github"
            : "link";
        const { error: evidenceError } = await supabase
          .from("evidence")
          .insert(
            missing.map((taskId) => ({
              task_id: taskId,
              user_id: user.id,
              type,
              url: evidenceLink,
              description: summary.slice(0, 500),
              metadata: { daily_log_id: log.id },
            })),
          );
        if (evidenceError) return { error: "log.partialError" };
      }
    }
    await supabase
      .from("audit_logs")
      .insert({
        project_id: projectId,
        user_id: user.id,
        action: "daily_log_submitted",
        details: { log_date: logDate, task_count: taskIds.length },
      });
    revalidatePath(`/app/projects/${projectId}`);
    revalidatePath("/app");
    return { saved: true, projectId };
  } catch {
    return { error: persisted ? "log.partialError" : "log.saveError" };
  }
}
