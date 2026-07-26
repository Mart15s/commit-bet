import { DailyLogForm } from "@/components/daily-log-form";
import { ButtonLink, EmptyState, PageHeader, SuccessState } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function DailyLogPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; error?: string; saved?: string; summary?: string; tasks?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, start_date, end_date, project_member_profiles!inner(user_id)")
    .eq("status", "active")
    .eq("project_member_profiles.user_id", user.id);
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
      <PageHeader title="Daily progress" description="Keep it brief. Record what changed, attach proof to tasks, and move on." />
      {params.saved && (
        <div className="mb-4">
          <SuccessState
            title="Progress logged"
            copy="Your team can now review your work. Proof links were attached to the selected task when you added one."
            details={(
              <div>
                <p className="font-bold">Submitted update</p>
                <p className="mt-1 text-muted-foreground">{params.summary || "Daily progress saved."}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[.12em] text-emerald-200">{params.tasks || 0} linked task{params.tasks === "1" ? "" : "s"}</p>
              </div>
            )}
            action={<ButtonLink href={params.project ? `/app/projects/${params.project}` : "/app"} variant="secondary">View project progress</ButtonLink>}
          />
        </div>
      )}
      {withTasks.length ? (
        <DailyLogForm projects={withTasks} initialProject={params.project} error={params.error} />
      ) : (
        <EmptyState
          title="No active project yet"
          copy="Daily check-ins start after a project is created, the AI plan is reviewed, and the team starts the commitment."
          tip="Next: create a project or ask the owner to start the drafted plan."
          action={<ButtonLink href="/app/projects/new">Create first project</ButtonLink>}
        />
      )}
    </>
  );
}
