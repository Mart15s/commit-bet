import { Brain, CalendarDays, Coins, FileCheck2, Gauge, ShieldCheck, Users } from "lucide-react";
import { generatePlan, startProject, updateDraftTask } from "@/app/(protected)/app/projects/actions";
import { T } from "@/components/i18n-text";
import { TranslatedSelect } from "@/components/translated-form";
import { Button, ButtonLink, Card, EmptyState, ErrorMessage, EvidenceExamples, HelpCard, MetricCard, NextActionCard, PageHeader, Progress, SectionHeader, StatusBadge } from "@/components/ui";
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
  const plan = reports?.[0]?.output as {
    phases?: Array<{ name: string; description: string }>;
    deliverables?: string[];
    risks?: string[];
    minimum_success_version?: string;
    ambitious_success_version?: string;
    reasoning?: string;
  } | undefined;
  const projectDisputes = (disputes ?? []).filter((dispute) => (dispute.tasks as unknown as { project_id?: string } | null)?.project_id === id);
  const pendingReviews = taskRows.filter((task) => task.status === "submitted");
  const statusCounts = ["todo", "in_progress", "submitted", "approved", "needs_changes", "rejected", "disputed"].map((status) => ({
    status,
    count: taskRows.filter((task) => task.status === status).length,
  }));
  const durationDays = Math.max(1, Math.ceil((new Date(`${project.end_date}T00:00:00`).getTime() - new Date(`${project.start_date}T00:00:00`).getTime()) / 86_400_000) + 1);
  const planLooksLarge = taskRows.length > Math.max(4, Math.ceil(durationDays / 2));

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
        action={<div className="flex flex-wrap gap-2"><StatusBadge status={project.status} /><ButtonLink href={`/app/projects/${id}/tasks`} variant="secondary" size="sm"><T k="project.taskBoard" /></ButtonLink></div>}
      />
      <ErrorMessage message={query.error} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={<T k="project.successScore" />} value={`${evidenceAdjustedScore}%`} detail={<>{approved}/{taskRows.length || 0} <T k="project.approvedDetail" /></>} icon={<Gauge size={20} />} />
        <MetricCard label={<T k="project.daysRemaining" />} value={remaining} detail={`${formatDate(project.start_date)} - ${formatDate(project.end_date)}`} icon={<CalendarDays size={20} />} />
        <MetricCard label={<T k="project.pledgePool" />} value={pledgePool || 0} detail={<T k="project.pledgeDetail" />} icon={<Coins size={20} />} />
        <MetricCard label={<T k="project.team" />} value={profiles?.length ?? 0} detail={<T k="project.teamDetail" />} icon={<Users size={20} />} />
      </div>

      <Card className="mt-4">
        <div className="mb-2 flex justify-between text-sm font-black"><span><T k="project.approvedProgress" /></span><span>{progress}%</span></div>
        <Progress value={progress} />
      </Card>

      {project.status === "draft" && isOwner && (
        <Card className="mt-6 border-cyan-300/25 bg-cyan-400/10">
          <div className="flex gap-3">
            <Brain className="mt-1 text-cyan-300" />
            <div>
              <h2 className="text-xl font-black"><T k="project.aiPlanHeadline" /></h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground"><T k="project.aiPlanCopy" /></p>
            </div>
          </div>
          {taskRows.length ? (
            <HelpCard title={<T k="project.notLocked" />} tone="cyan" className="mt-4">
              <T k="project.notLockedCopy" />
            </HelpCard>
          ) : (
            <HelpCard title={<T k="project.afterGeneration" />} tone="cyan" className="mt-4">
              <T k="project.afterGenerationCopy" />
            </HelpCard>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <form action={generatePlan}><input type="hidden" name="project_id" value={id} /><Button className="w-full" type="submit"><T k="project.generateAiPlan" /></Button></form>
            {taskRows.length ? <ButtonLink href="#edit-plan" variant="secondary"><T k="project.editPlanFirst" /></ButtonLink> : null}
            {taskRows.length ? <form action={startProject}><input type="hidden" name="project_id" value={id} /><Button className="w-full" variant="secondary" type="submit"><T k="project.startWithPlan" /></Button></form> : null}
          </div>
        </Card>
      )}

      {project.status === "draft" && taskRows.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_.85fr]">
          <Card>
            <SectionHeader title={<T k="project.aiPlanDraft" />} description={<T k="project.aiPlanDraftDescription" />} />
            <div className="grid gap-3 sm:grid-cols-2">
              {(plan?.phases ?? []).map((phase) => (
                <div key={phase.name} className="rounded-xl border border-border bg-secondary p-4">
                  <p className="text-xs font-black uppercase tracking-[.12em] text-cyan-300"><T k="project.phase" /></p>
                  <h3 className="mt-1 font-black">{phase.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{phase.description}</p>
                </div>
              ))}
              {(plan?.deliverables ?? []).slice(0, 4).map((deliverable) => (
                <div key={deliverable} className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[.12em] text-primary"><T k="project.deliverable" /></p>
                  <p className="mt-1 text-sm font-bold leading-6">{deliverable}</p>
                </div>
              ))}
            </div>
            {!plan?.phases?.length && !plan?.deliverables?.length && (
              <p className="text-sm leading-6 text-muted-foreground"><T k="project.generatePlanEmpty" /></p>
            )}
          </Card>
          <Card className={planLooksLarge ? "border-amber-300/30 bg-amber-400/10" : "border-cyan-300/25 bg-cyan-400/10"}>
            <SectionHeader title={planLooksLarge ? "Plan may be too large" : "Proof expectations"} />
            <p className="text-sm leading-6 text-muted-foreground">
              {planLooksLarge
                ? `This draft has ${taskRows.length} tasks for a ${durationDays}-day commitment. Consider trimming scope before starting.`
                : "Each task should have evidence that a teammate can open, inspect, and compare to acceptance criteria."}
            </p>
            <div className="mt-4"><EvidenceExamples compact /></div>
            {plan?.risks?.length ? (
              <div className="mt-4 rounded-xl border border-border bg-background/45 p-3 text-sm">
                <p className="font-black"><T k="project.aiRiskNote" /></p>
                <p className="mt-1 text-muted-foreground">{plan.risks[0]}</p>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <SectionHeader title={<T k="project.tasksByStatus" />} description={<T k="project.tasksByStatusDescription" />} action={<ButtonLink href={`/app/projects/${id}/tasks`} variant="secondary" size="sm"><T k="project.openBoard" /></ButtonLink>} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statusCounts.map((item) => (
              <div key={item.status} className="rounded-xl border border-border bg-secondary p-3">
                <StatusBadge status={item.status} />
                <p className="mt-2 text-2xl font-black">{item.count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-cyan-300/25 bg-cyan-400/10">
          <div className="flex gap-3">
            <Brain className="mt-1 text-cyan-300" />
            <div>
              <h2 className="font-black"><T k="dashboard.aiRiskInsight" /></h2>
              <p className="mt-2 text-sm leading-6 text-cyan-100">
                {plan?.risks?.[0] || (remaining <= 2 && progress < 80 ? "Deadline is close and approved evidence is below target." : "No generated risk note yet. Generate the AI plan to get a specific review.")}
              </p>
              <p className="mt-3 rounded-xl border border-cyan-300/20 bg-background/50 p-3 text-xs font-bold text-cyan-100">
                <T k="dashboard.why" /> {plan?.minimum_success_version || plan?.reasoning || `${submitted} submitted tasks and ${projectDisputes.length} open dispute signals are included in the score.`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {taskRows.length ? (
        <section className="mt-8">
          <SectionHeader title={<T k="project.taskBoardTitle" />} description={<T k="project.taskBoardDescription" />} />
          <TaskBoard tasks={boardTasks} />
        </section>
      ) : (
        <section className="mt-8">
          <EmptyState
            title={<T k="project.noTasksTitle" />}
            copy={<T k="project.noTasksCopy" />}
            action={project.status === "draft" && isOwner ? <form action={generatePlan}><input type="hidden" name="project_id" value={id} /><Button type="submit"><T k="project.generateAiPlan" /></Button></form> : null}
          />
        </section>
      )}

      {project.status === "draft" && isOwner && taskRows.length ? (
        <section className="mt-8" id="edit-plan">
          <SectionHeader title={<T k="project.editPlanTitle" />} description={<T k="project.editPlanDescription" />} />
          <div className="grid gap-3">
            {taskRows.map((task) => {
              const assignment = singleRelation(task.task_assignments as unknown as Assignment | Assignment[]);
              return (
                <Card key={task.id}>
                  <form action={updateDraftTask} className="grid gap-3 sm:grid-cols-[1fr_10rem_9rem]">
                    <input type="hidden" name="project_id" value={id} /><input type="hidden" name="task_id" value={task.id} />
                    <label><T k="project.task" /><input name="title" defaultValue={task.title} required /></label>
                    <label><T k="project.due" /><input name="due_date" type="date" defaultValue={task.due_date} required /></label>
                    <label><T k="project.priority" /><TranslatedSelect name="priority" defaultValue={task.priority} options={[
                      { value: "low", labelKey: "status.low" },
                      { value: "medium", labelKey: "status.medium" },
                      { value: "high", labelKey: "status.high" },
                      { value: "critical", labelKey: "status.critical" },
                    ]} /></label>
                    <label className="sm:col-span-2"><T k="project.assignee" /><select name="assigned_user_id" defaultValue={assignment?.user_id}>{profiles?.map((profile) => <option key={profile.user_id} value={profile.user_id}>{(profile.profiles as unknown as { name: string }).name}</option>)}</select></label>
                    <Button className="self-end" type="submit" variant="secondary"><T k="project.saveTask" /></Button>
                    <div className="sm:col-span-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
                        <p className="font-black"><T k="project.acceptanceCriteria" /></p>
                        <p className="mt-1 text-muted-foreground">{(task.acceptance_criteria ?? []).join("; ") || "Add criteria in the task detail after starting."}</p>
                      </div>
                      <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3">
                        <p className="font-black"><T k="project.expectedEvidence" /></p>
                        <p className="mt-1 text-muted-foreground">{(task.expected_evidence_types ?? []).join(", ") || "Proof requirement pending."}</p>
                        {assignment?.assigned_reason && <p className="mt-2 text-xs text-muted-foreground">Why this member: {assignment.assigned_reason}</p>}
                      </div>
                    </div>
                  </form>
                </Card>
              );
            })}
          </div>
          <NextActionCard
            className="mt-4"
            title={<T k="project.startWhenFair" />}
            copy={<T k="project.startWhenFairCopy" />}
            action={<form action={startProject}><input type="hidden" name="project_id" value={id} /><Button type="submit"><T k="project.startWithPlan" /></Button></form>}
          />
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionHeader title={<T k="project.memberContribution" />} />
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
                  <div className="mb-1 flex justify-between text-sm"><strong>{(profile.profiles as unknown as { name: string }).name}</strong><span className="text-muted-foreground">{score}%</span></div>
                  <Progress value={score} />
                  <p className="mt-1 text-xs text-muted-foreground">{memberApproved}/{memberTasks.length} assigned tasks approved</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader title={<T k="project.recentDailyLogs" />} action={project.status === "active" ? <ButtonLink href={`/app/logs/new?project=${id}`} variant="secondary" size="sm"><T k="project.logToday" /></ButtonLink> : null} />
          <div className="space-y-3">
            {logs?.map((log) => (
              <div key={log.id} className="border-b border-border pb-3 last:border-0">
                <p className="font-bold">{(log.profiles as unknown as { name: string }).name} · {log.time_spent_minutes} min</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{log.summary}</p>
              </div>
            ))}
            {!logs?.length && (
              <EmptyState
                title={<T k="project.noDailyLogs" />}
                copy={<T k="project.noDailyLogsCopy" />}
                action={project.status === "active" ? <ButtonLink href={`/app/logs/new?project=${id}`} variant="secondary"><T k="project.logToday" /></ButtonLink> : null}
                className="py-7"
              />
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader title={<T k="project.reviewsDisputes" />} action={<ButtonLink href={`/app/projects/${id}/reviews`} variant="secondary" size="sm"><T k="project.reviewQueue" /></ButtonLink>} />
          <div className="space-y-3">
            {pendingReviews.map((task) => <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto w-full justify-between p-3 text-left"><span className="font-bold">{task.title}</span><StatusBadge status="submitted" /></ButtonLink>)}
            {projectDisputes.map((dispute) => <div key={dispute.id} className="rounded-xl border border-rose-300/30 bg-rose-500/12 p-3 text-sm"><strong>{(dispute.tasks as unknown as { title: string }).title}</strong><p className="mt-1 text-muted-foreground">{dispute.reason}</p></div>)}
            {!pendingReviews.length && !projectDisputes.length && (
              <EmptyState
                title={<T k="project.noPendingApprovals" />}
                copy={<T k="project.noPendingApprovalsCopy" />}
                tip={<T k="dashboard.nothingToReviewTip" />}
                className="py-7"
              />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <Card>
          <div className="flex items-start gap-3">
            <Coins className="text-amber-300" />
            <div>
              <h2 className="font-black"><T k="project.virtualPledges" /></h2>
              <p className="mt-1 text-xs text-muted-foreground"><T k="project.virtualPledgesCopy" /></p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pledges?.map((pledge) => <div key={pledge.id} className="flex justify-between rounded-xl border border-amber-300/20 bg-amber-400/10 p-3"><span>{(pledge.profiles as unknown as { name: string }).name}</span><strong className="text-amber-200">{pledge.amount} {pledge.currency}</strong></div>)}
          </div>
        </Card>

        {project.status === "active" && isOwner ? (
          <Card className="flex flex-col items-start justify-between gap-4 border-amber-300/30 bg-amber-400/10 sm:flex-row sm:items-center">
            <div className="flex gap-3"><ShieldCheck className="text-amber-300" /><div><h2 className="font-black"><T k="project.readyClose" /></h2><p className="text-sm text-muted-foreground"><T k="project.readyCloseCopy" /></p></div></div>
            <ButtonLink href={`/app/projects/${id}/final`}><T k="project.finalReport" /></ButtonLink>
          </Card>
        ) : (
          <Card className="flex gap-3">
            <FileCheck2 className="text-cyan-300" />
            <div><h2 className="font-black"><T k="project.evidenceTruth" /></h2><p className="mt-1 text-sm text-muted-foreground"><T k="project.evidenceTruthCopy" /></p></div>
          </Card>
        )}
      </div>
    </>
  );
}
