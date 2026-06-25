import { DailyLogForm } from "@/components/daily-log-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function DailyLogPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: projects } = await supabase.from("projects").select("id, title").eq("status", "active");
  const withTasks = [];
  for (const project of projects ?? []) {
    const { data: rows } = await supabase
      .from("task_assignments")
      .select("tasks(id, title, status)")
      .eq("user_id", user.id)
      .eq("tasks.project_id", project.id);
    withTasks.push({
      ...project,
      tasks: (rows ?? [])
        .map((row) => row.tasks as unknown as { id: string; title: string; status: string } | null)
        .filter((task): task is { id: string; title: string; status: string } => Boolean(task)),
    });
  }
  return (
    <>
      <PageHeader title="Daily progress" description="Keep it brief. Record what changed, link it to tasks, and move on." />
      {withTasks.length ? <DailyLogForm projects={withTasks} initialProject={params.project} error={params.error} /> : <EmptyState title="No active project" copy="Start a project before adding a daily log." />}
    </>
  );
}
