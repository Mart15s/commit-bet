import { DailyLogForm } from "@/components/daily-log-form";
import { T } from "@/components/i18n-text";
import { ButtonLink, EmptyState, PageHeader, SuccessState } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function DailyLogPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; error?: string; saved?: string; summary?: string; tasks?: string }>;
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
      <PageHeader title={<T k="daily.title" />} description={<T k="daily.description" />} />
      {params.saved && (
        <div className="mb-4">
          <SuccessState
            title={<T k="daily.loggedTitle" />}
            copy={<T k="daily.loggedCopy" />}
            details={(
              <div>
                <p className="font-bold"><T k="daily.submittedUpdate" /></p>
                <p className="mt-1 text-muted-foreground">{params.summary || <T k="daily.savedFallback" />}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[.12em] text-emerald-200">{params.tasks || 0} <T k={params.tasks === "1" ? "daily.linkedTask" : "daily.linkedTasks"} /></p>
              </div>
            )}
            action={<ButtonLink href={params.project ? `/app/projects/${params.project}` : "/app"} variant="secondary"><T k="daily.viewProjectProgress" /></ButtonLink>}
          />
        </div>
      )}
      {withTasks.length ? (
        <DailyLogForm projects={withTasks} initialProject={params.project} error={params.error} />
      ) : (
        <EmptyState
          title={<T k="daily.noActiveTitle" />}
          copy={<T k="daily.noActiveCopy" />}
          tip={<T k="daily.noActiveTip" />}
          action={<ButtonLink href="/app/projects/new"><T k="dashboard.createFirstProject" /></ButtonLink>}
        />
      )}
    </>
  );
}
