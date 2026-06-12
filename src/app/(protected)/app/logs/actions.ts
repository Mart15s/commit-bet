"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export async function saveDailyLog(formData: FormData) {
  const { supabase, user } = await requireUser();
  const projectId = String(formData.get("project_id"));
  const { data: project } = await supabase.from("projects").select("id, status").eq("id", projectId).single();
  if (!project || project.status !== "active") redirect("/app/logs/new?error=Choose an active project.");

  const logDate = String(formData.get("log_date") || new Date().toISOString().slice(0, 10));
  const { data: log, error } = await supabase
    .from("daily_logs")
    .upsert({
      project_id: projectId,
      user_id: user.id,
      log_date: logDate,
      summary: String(formData.get("summary") ?? ""),
      time_spent_minutes: Number(formData.get("time_spent_minutes") || 0),
      blockers: String(formData.get("blockers") ?? ""),
      next_steps: String(formData.get("next_steps") ?? ""),
    }, { onConflict: "project_id,user_id,log_date" })
    .select("id")
    .single();
  if (error || !log) redirect(`/app/logs/new?project=${projectId}&error=${encodeURIComponent(error?.message || "Could not save log")}`);

  await supabase.from("daily_log_tasks").delete().eq("daily_log_id", log.id);
  const taskIds = [...new Set(formData.getAll("task_id").map(String))];
  if (taskIds.length) {
    const { data: projectTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("project_id", projectId)
      .in("id", taskIds);
    if (projectTasks?.length !== taskIds.length) {
      redirect(`/app/logs/new?project=${projectId}&error=Every selected task must belong to this project.`);
    }
  }
  if (taskIds.length) await supabase.from("daily_log_tasks").insert(taskIds.map((taskId) => ({ daily_log_id: log.id, task_id: taskId })));

  await supabase.from("audit_logs").insert({
    project_id: projectId,
    user_id: user.id,
    action: "daily_log_submitted",
    details: { log_date: logDate, task_count: taskIds.length },
  });
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
}
