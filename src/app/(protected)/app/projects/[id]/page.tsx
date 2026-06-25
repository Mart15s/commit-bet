import { Brain, CalendarDays, Coins, FileCheck2, Gauge, ShieldCheck, Users } from "lucide-react";
import { generatePlan, startProject, updateDraftTask } from "@/app/(protected)/app/projects/actions";
import { Button, ButtonLink, Card, ErrorMessage, MetricCard, PageHeader, Progress, SectionHeader, StatusBadge } from "@/components/ui";
import { TaskBoard, type BoardTask } from "@/components/tasks/task-board";
import { requireProjectMember } from "@/lib/auth";
import { formatDate, singleRelation } from "@/lib/utils";

type Assignment = { user_id: string; assigned_reason: string; profiles: { name: string } };

function daysUntil(value: string) {
  const today = new Date();
  const end = new Date(`${value}T00:00:00`);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
}

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
  const [{ data: profiles }, { data: pledges }, { data: tasks }, { data: logs }, { data: reports }, { data: disputes }] = await Promise.all([
    supabase.from("project_member_profiles").select("*, profiles(name, email)").eq("project_id", id),
    supabase.from("pledges").select("*, profiles(name)").eq("project_id", id),
    supabase.from("tasks").select("*, task_assignments(user_id, assigned_reason, profiles(name))").eq("project_id", id).order("due_date"),
    supabase.from("daily_logs").select("*, profiles(name)").eq("project_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("ai_reports").select("output").eq("project_id", id).eq("type", "plan").order("created_at", { ascending: false }).limit(1),
    supabase.from("disputes").select("id, status, reason, tasks(title, project_id)").order("created_at", { ascending: false }),
  ]);

  const taskRows = tasks ?? [];
  const approved = taskRows.filter((task) => task.status === "approved").length;
  const submitted = taskRows.filter((task) => task.status === "submitted").length;
  const progress = taskRows.length ? Math.round((approved / taskRows.length) * 100) : 0;
  const evidenceAdjustedScore = taskRows.length ? Math.min(100, progress + submitted * 4) : 0;
  const remaining = daysUntil(project.end_date);
  const pledgePool = (pledges ?? []).reduce((total, pledge) => total + Number(pledge.amount ?? 0), 0);
  const plan = reports?.[0]?.output as { risks?: string[]; minimum_success_version?: string; reasoning?: string } | undefined;
  const projectDisputes = (disputes ?? []).filter((dispute) => (dispute.tasks as unknown as { project_id?: string } | null)?.project_id === id);
  const pendingReviews = taskRows.filter((task) => task.status === "submitted");
  const statusCounts = ["todo", "in_progress", "submitted", "approved", "needs_changes", "rejected", "disputed"].map((status) => ({
    status,
    count: taskRows.filter((task) => task.status === status).length,
  }));

  const boardTasks: BoardTask[] = taskRows.map((task) => {
    const assignment = singleRelation(task.task_assignments as unknown as Assignment | Assignment[]);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      ownerName: assignment?.profiles?.name,
      expectedEvidenceTypes: task.expected_evidence_types ?? [],
      acceptanceCriteria: task.acceptance_criteria ?? [],
    };
  });

  return (
    <>
      <PageHeader
        eyebrow={project.status}
        title={project.title}
        description={project.goal}
        action={<div className="flex flex-wrap gap-2"><StatusBadge status={project.status} /><ButtonLink href={`/app/projects/${id}/tasks`} variant="secondary" size="sm">Task board</ButtonLink></div>}
      />
      <ErrorMessage message={query.error} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Success score" value={`${evidenceAdjustedScore}%`} detail={`${approved}/${taskRows.length || 0} approved`} icon={<Gauge size={20} />} />
        <MetricCard label="Days remaining" value={remaining} detail={`${formatDate(project.start_date)} - ${formatDate(project.end_date)}`} icon={<CalendarDays size={20} />} />
        <MetricCard label="Pledge pool" value={pledgePool || 0} detail="Virtual points or declared labels" icon={<Coins size={20} />} />
        <MetricCard label="Team" value={profiles?.length ?? 0} detail="Members in commitment" icon={<Users size={20} />} />
      </div>

      <Card className="mt-4">
        <div className="mb-2 flex justify-between text-sm font-black"><span>Approved progress</span><span>{progress}%</span></div>
        <Progress value={progress} />
      </Card>

      {project.status === "draft" && isOwner && (
        <Card className="mt-6 border-[#cfd9a1] bg-[#fbffe4]">
          <div className="flex gap-3">
            <Brain className="mt-1 text-[var(--brand)]" />
            <div>
              <h2 className="text-xl font-black">{taskRows.length ? "Review the AI plan" : "Generate your execution plan"}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">AI turns the commitment into tasks with owners, due dates, acceptance criteria, expected evidence, and risk notes.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <form action={generatePlan}><input type="hidden" name="project_id" value={id} /><Button className="w-full" type="submit">{taskRows.length ? "Regenerate plan" : "Generate AI plan"}</Button></form>
            {taskRows.length ? <form action={startProject}><input type="hidden" name="project_id" value={id} /><Button className="w-full" variant="secondary" type="submit">Confirm and start project</Button></form> : null}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <SectionHeader title="Tasks by status" description="Progress only becomes real when submitted evidence is reviewed." action={<ButtonLink href={`/app/projects/${id}/tasks`} variant="secondary" size="sm">Open board</ButtonLink>} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statusCounts.map((item) => (
              <div key={item.status} className="rounded-xl bg-[#f4f6f2] p-3">
                <StatusBadge status={item.status} />
                <p className="mt-2 text-2xl font-black">{item.count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-[#e4d09b] bg-[#fffaf0]">
          <div className="flex gap-3">
            <Brain className="mt-1 text-[#8a6814]" />
            <div>
              <h2 className="font-black">AI risk insight</h2>
              <p className="mt-2 text-sm leading-6 text-[#735813]">
                {plan?.risks?.[0] || (remaining <= 2 && progress < 80 ? "Deadline is close and approved evidence is below target." : "No generated risk note yet. Generate the AI plan to get a specific review.")}
              </p>
              <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs font-bold text-[#735813]">
                Why: {plan?.minimum_success_version || plan?.reasoning || `${submitted} submitted tasks and ${projectDisputes.length} open dispute signals are included in the score.`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {taskRows.length ? (
        <section className="mt-8">
          <SectionHeader title="Task board" description="Todo, in progress, submitted, approved, changes, rejected, and disputed work in one view." />
          <TaskBoard tasks={boardTasks} />
        </section>
      ) : null}

      {project.status === "draft" && isOwner && taskRows.length ? (
        <section className="mt-8">
          <SectionHeader title="Edit draft AI tasks" description="Adjust owner, due date, and priority before starting the project." />
          <div className="grid gap-3">
            {taskRows.map((task) => {
              const assignment = singleRelation(task.task_assignments as unknown as Assignment | Assignment[]);
              return (
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
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionHeader title="Member contribution" />
          <div className="space-y-4">
            {profiles?.map((profile) => {
              const memberTasks = taskRows.filter((task) => {
                const assignment = singleRelation(task.task_assignments as unknown as Assignment | Assignment[]);
                return assignment?.user_id === profile.user_id;
              });
              const memberApproved = memberTasks.filter((task) => task.status === "approved").length;
              const score = memberTasks.length ? Math.round((memberApproved / memberTasks.length) * 100) : 0;
              return (
                <div key={profile.user_id}>
                  <div className="mb-1 flex justify-between text-sm"><strong>{(profile.profiles as unknown as { name: string }).name}</strong><span className="text-[var(--muted)]">{score}%</span></div>
                  <Progress value={score} />
                  <p className="mt-1 text-xs text-[var(--muted)]">{memberApproved}/{memberTasks.length} assigned tasks approved</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Recent daily logs" action={project.status === "active" ? <ButtonLink href={`/app/logs/new?project=${id}`} variant="secondary" size="sm">Log today</ButtonLink> : null} />
          <div className="space-y-3">
            {logs?.map((log) => (
              <div key={log.id} className="border-b border-[var(--line)] pb-3 last:border-0">
                <p className="font-bold">{(log.profiles as unknown as { name: string }).name} · {log.time_spent_minutes} min</p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{log.summary}</p>
              </div>
            ))}
            {!logs?.length && <p className="text-sm text-[var(--muted)]">No daily logs yet.</p>}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Reviews and disputes" action={<ButtonLink href={`/app/projects/${id}/reviews`} variant="secondary" size="sm">Review queue</ButtonLink>} />
          <div className="space-y-3">
            {pendingReviews.map((task) => <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto w-full justify-between p-3 text-left"><span className="font-bold">{task.title}</span><StatusBadge status="submitted" /></ButtonLink>)}
            {projectDisputes.map((dispute) => <div key={dispute.id} className="rounded-xl bg-[#fff6d9] p-3 text-sm"><strong>{(dispute.tasks as unknown as { title: string }).title}</strong><p className="mt-1 text-[var(--muted)]">{dispute.reason}</p></div>)}
            {!pendingReviews.length && !projectDisputes.length && <p className="text-sm text-[var(--muted)]">No pending reviews or disputes.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <Card>
          <div className="flex items-start gap-3">
            <Coins className="text-[var(--brand)]" />
            <div>
              <h2 className="font-black">Virtual pledges</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Declared commitments only. CommitBet does not hold money.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pledges?.map((pledge) => <div key={pledge.id} className="flex justify-between rounded-xl bg-[#f5f7f3] p-3"><span>{(pledge.profiles as unknown as { name: string }).name}</span><strong>{pledge.amount} {pledge.currency}</strong></div>)}
          </div>
        </Card>

        {project.status === "active" && isOwner ? (
          <Card className="flex flex-col items-start justify-between gap-4 border-[#b9d6bf] bg-[#eff8f1] sm:flex-row sm:items-center">
            <div className="flex gap-3"><ShieldCheck className="text-[var(--brand)]" /><div><h2 className="font-black">Ready to close the sprint?</h2><p className="text-sm text-[var(--muted)]">Generate an evidence-based AI final report before confirming virtual pledge outcomes.</p></div></div>
            <ButtonLink href={`/app/projects/${id}/final`}>Final report</ButtonLink>
          </Card>
        ) : (
          <Card className="flex gap-3">
            <FileCheck2 className="text-[var(--brand)]" />
            <div><h2 className="font-black">Evidence is the source of truth</h2><p className="mt-1 text-sm text-[var(--muted)]">Use task detail pages to attach proof and peer reviews before the final report.</p></div>
          </Card>
        )}
      </div>
    </>
  );
}
