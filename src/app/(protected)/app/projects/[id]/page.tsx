import { CalendarDays, ShieldCheck, Target, Users } from "lucide-react";
import { generatePlan, startProject, updateDraftTask } from "@/app/(protected)/app/projects/actions";
import { Button, ButtonLink, Card, ErrorMessage, PageHeader, StatusBadge } from "@/components/ui";
import { requireProjectMember } from "@/lib/auth";
import { formatDate, singleRelation } from "@/lib/utils";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user, project } = await requireProjectMember(id);
  const isOwner = project.created_by === user.id;
  const [{ data: profiles }, { data: pledges }, { data: tasks }, { data: logs }, { data: reports }] = await Promise.all([
    supabase.from("project_member_profiles").select("*, profiles(name)").eq("project_id", id),
    supabase.from("pledges").select("*, profiles(name)").eq("project_id", id),
    supabase.from("tasks").select("*, task_assignments(user_id, assigned_reason, profiles(name))").eq("project_id", id).order("due_date"),
    supabase.from("daily_logs").select("*, profiles(name)").eq("project_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("ai_reports").select("output").eq("project_id", id).eq("type", "plan").order("created_at", { ascending: false }).limit(1),
  ]);
  const approved = tasks?.filter((task) => task.status === "approved").length ?? 0;
  const progress = tasks?.length ? Math.round((approved / tasks.length) * 100) : 0;
  const plan = reports?.[0]?.output as { risks?: string[]; minimum_success_version?: string } | undefined;

  return (
    <>
      <PageHeader
        eyebrow={project.status}
        title={project.title}
        description={project.goal}
        action={<StatusBadge status={project.status} />}
      />
      <ErrorMessage message={query.error} />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3"><CalendarDays className="text-[var(--brand)]" /><div><p className="text-xs font-bold text-[var(--muted)]">Sprint</p><p className="font-black">{formatDate(project.start_date)} - {formatDate(project.end_date)}</p></div></Card>
        <Card className="flex items-center gap-3"><Target className="text-[var(--brand)]" /><div><p className="text-xs font-bold text-[var(--muted)]">Progress</p><p className="font-black">{progress}% approved</p></div></Card>
        <Card className="flex items-center gap-3"><Users className="text-[var(--brand)]" /><div><p className="text-xs font-bold text-[var(--muted)]">Team</p><p className="font-black">{profiles?.length ?? 0} members</p></div></Card>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#dde2db]"><div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${progress}%` }} /></div>

      {project.status === "draft" && isOwner && (
        <Card className="mt-6 border-[#cfd9a1] bg-[#fbffe4]">
          <h2 className="text-xl font-black">{tasks?.length ? "Review the AI plan" : "Generate your execution plan"}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Mock AI works immediately. You can regenerate or edit task basics before starting.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <form action={generatePlan}><input type="hidden" name="project_id" value={id} /><Button className="w-full" type="submit">{tasks?.length ? "Regenerate plan" : "Generate AI plan"}</Button></form>
            {tasks?.length ? <form action={startProject}><input type="hidden" name="project_id" value={id} /><Button className="w-full" variant="secondary" type="submit">Confirm and start project</Button></form> : null}
          </div>
        </Card>
      )}

      {plan?.risks?.length ? <Card className="mt-5"><h2 className="font-black">AI risk note</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">{plan.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul></Card> : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-black">Tasks</h2>{project.status === "active" && <ButtonLink href={`/app/logs/new?project=${id}`} variant="secondary">Daily log</ButtonLink>}</div>
        <div className="grid gap-3">
          {tasks?.map((task) => {
            const assignment = singleRelation(task.task_assignments as unknown as
              | { user_id: string; assigned_reason: string; profiles: { name: string } }
              | Array<{ user_id: string; assigned_reason: string; profiles: { name: string } }>);
            return project.status === "draft" && isOwner ? (
              <Card key={task.id}>
                <form action={updateDraftTask} className="grid gap-3 sm:grid-cols-[1fr_10rem_9rem]">
                  <input type="hidden" name="project_id" value={id} /><input type="hidden" name="task_id" value={task.id} />
                  <label>Task<input name="title" defaultValue={task.title} required /></label>
                  <label>Due<input name="due_date" type="date" defaultValue={task.due_date} required /></label>
                  <label>Priority<select name="priority" defaultValue={task.priority}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
                  <label className="sm:col-span-2">Assignee<select name="assigned_user_id" defaultValue={assignment?.user_id}>{profiles?.map((profile) => <option key={profile.user_id} value={profile.user_id}>{(profile.profiles as unknown as { name: string }).name}</option>)}</select></label>
                  <Button className="self-end" type="submit" variant="secondary">Save task</Button>
                </form>
              </Card>
            ) : (
              <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto justify-start rounded-2xl p-0 text-left">
                <Card className="w-full border-0">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{task.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{assignment?.profiles?.name || "Unassigned"} · due {formatDate(task.due_date)}</p></div><StatusBadge status={task.status} /></div>
                </Card>
              </ButtonLink>
            );
          })}
          {!tasks?.length && <Card className="text-center text-[var(--muted)]">No tasks yet. Generate the first plan above.</Card>}
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card><h2 className="font-black">Virtual pledges</h2><p className="mt-1 text-xs text-[var(--muted)]">Declared commitments only. No money is held.</p><div className="mt-4 space-y-2">{pledges?.map((pledge) => <div key={pledge.id} className="flex justify-between rounded-xl bg-[#f5f7f3] p-3"><span>{(pledge.profiles as unknown as { name: string }).name}</span><strong>{pledge.amount} {pledge.currency}</strong></div>)}</div></Card>
        <Card><h2 className="font-black">Latest logs</h2><div className="mt-4 space-y-3">{logs?.map((log) => <div key={log.id} className="border-b border-[var(--line)] pb-3 last:border-0"><p className="font-bold">{(log.profiles as unknown as { name: string }).name} · {log.time_spent_minutes} min</p><p className="mt-1 text-sm text-[var(--muted)]">{log.summary}</p></div>)}{!logs?.length && <p className="text-sm text-[var(--muted)]">No daily logs yet.</p>}</div></Card>
      </div>

      {project.status === "active" && isOwner && (
        <Card className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-3"><ShieldCheck className="text-[var(--brand)]" /><div><h2 className="font-black">Ready to close the sprint?</h2><p className="text-sm text-[var(--muted)]">Generate an evidence-based final report before confirming pledges.</p></div></div>
          <ButtonLink href={`/app/projects/${id}/final`}>Final report</ButtonLink>
        </Card>
      )}
    </>
  );
}
