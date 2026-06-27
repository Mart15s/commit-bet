import { DailyLogForm } from "@/components/daily-log-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { T } from "@/i18n/useTranslation";
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
      <PageHeader title={<T k="dailyLog.pageTitle" />} description={<T k="dailyLog.pageDescription" />} />
      {withTasks.length ? <DailyLogForm projects={withTasks} initialProject={params.project} error={params.error} /> : <EmptyState title={<T k="dailyLog.emptyTitle" />} copy={<T k="dailyLog.emptyCopy" />} />}
    </>
  );
}
