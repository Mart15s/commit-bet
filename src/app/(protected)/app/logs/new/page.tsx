import { DailyLogForm } from "@/components/daily-log-form";
import { LogEmptyState } from "@/components/log-empty-state";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function DailyLogPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title")
    .eq("status", "active");
  const withTasks = await Promise.all(
    (projects ?? []).map(async (project) => {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("id, title, status, task_assignments!inner(user_id)")
        .eq("project_id", project.id)
        .eq("task_assignments.user_id", user.id);
      return { ...project, tasks: tasks ?? [], error: !!error };
    }),
  );
  return (
    <>
      <PageHeader titleKey="log.title" descriptionKey="log.copy" />
      {error || withTasks.some((p) => p.error) ? (
        <LogEmptyState error />
      ) : withTasks.length ? (
        <DailyLogForm
          projects={withTasks}
          initialProject={params.project}
          initialDate={new Date().toISOString().slice(0, 10)}
        />
      ) : (
        <LogEmptyState />
      )}
    </>
  );
}
