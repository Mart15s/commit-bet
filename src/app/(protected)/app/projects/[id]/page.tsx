import { AIRecommendation } from "@/components/ai-recommendation";
import { T, DateText } from "@/components/language-provider";
import { projectProgress } from "@/lib/progress";
import { randomUUID } from "node:crypto";
import {
  Brain,
  CalendarDays,
  Coins,
  FileCheck2,
  Gauge,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  startProject,
  updateDraftTask,
} from "@/app/(protected)/app/projects/actions";
import { AIPlanGenerationForm } from "@/components/ai-plan-generation-form";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorMessage,
  EvidenceExamples,
  HelpCard,
  MetricCard,
  NextActionCard,
  PageHeader,
  Progress,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { TaskBoard, type BoardTask } from "@/components/tasks/task-board";
import { requireProjectMember } from "@/lib/auth";
import { singleRelation } from "@/lib/utils";

type Assignment = {
  user_id: string;
  assigned_reason: string;
  profiles: { name: string };
};

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
  const [
    { data: profiles },
    { data: pledges, error: pledgesError },
    { data: tasks, error: tasksError },
    { data: logs },
    { data: reports },
    { data: disputes },
  ] = await Promise.all([
    supabase
      .from("project_member_profiles")
      .select("*, profiles(name, email)")
      .eq("project_id", id),
    supabase.from("pledges").select("*, profiles(name)").eq("project_id", id),
    supabase
      .from("tasks")
      .select("*, task_assignments(user_id, assigned_reason, profiles(name))")
      .eq("project_id", id)
      .order("due_date"),
    supabase
      .from("daily_logs")
      .select("*, profiles(name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ai_reports")
      .select("output, model")
      .eq("project_id", id)
      .eq("type", "plan")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("disputes")
      .select("id, status, reason, tasks(title, project_id)")
      .order("created_at", { ascending: false }),
  ]);

  if (tasksError || pledgesError)
    return (
      <>
        <PageHeader title={project.title} />
        <ErrorMessage message="dash.loadError" />
      </>
    );

  const taskRows = tasks ?? [];
  const approved = taskRows.filter((task) => task.status === "approved").length;
  const progress = projectProgress(taskRows);
  const remaining = daysUntil(project.end_date);
  const pledgePool = (pledges ?? [])
    .filter((pledge) => pledge.currency === "POINTS")
    .reduce((total, pledge) => total + Number(pledge.amount ?? 0), 0);
  const plan = reports?.[0]?.output as
    | {
        phases?: Array<{ name: string; description: string }>;
        deliverables?: string[];
        risks?: string[];
        minimum_success_version?: string;
        ambitious_success_version?: string;
        reasoning?: string;
      }
    | undefined;
  const projectDisputes = (disputes ?? []).filter(
    (dispute) =>
      (dispute.tasks as unknown as { project_id?: string } | null)
        ?.project_id === id,
  );
  const pendingReviews = taskRows.filter((task) => task.status === "submitted");
  const statusCounts = [
    "todo",
    "in_progress",
    "submitted",
    "approved",
    "needs_changes",
    "rejected",
    "disputed",
  ].map((status) => ({
    status,
    count: taskRows.filter((task) => task.status === status).length,
  }));
  const durationDays = Math.max(
    1,
    Math.ceil(
      (new Date(`${project.end_date}T00:00:00`).getTime() -
        new Date(`${project.start_date}T00:00:00`).getTime()) /
        86_400_000,
    ) + 1,
  );
  const planLooksLarge =
    taskRows.length > Math.max(4, Math.ceil(durationDays / 2));
  const planRequestId = randomUUID();

  const boardTasks: BoardTask[] = taskRows.map((task) => {
    const assignment = singleRelation(
      task.task_assignments as unknown as Assignment | Assignment[],
    );
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
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={project.status} />
            <ButtonLink
              href={`/app/projects/${id}/tasks`}
              variant="secondary"
              size="sm"
            >
              <T id="Task board" />
            </ButtonLink>
          </div>
        }
      />
      <ErrorMessage message={query.error} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="dash.verified"
          value={taskRows.length ? `${progress}%` : "—"}
          detail={`${approved}/${taskRows.length || 0}`}
          icon={<Gauge size={20} />}
        />
        <MetricCard
          label="Days remaining"
          value={remaining}
          detail={`${project.start_date} — ${project.end_date}`}
          icon={<CalendarDays size={20} />}
        />
        <MetricCard
          label="Virtual commitment points"
          value={pledgePool || 0}
          detail="Virtual points have no monetary value"
          icon={<Coins size={20} />}
        />
        <MetricCard
          label="Team"
          value={profiles?.length ?? 0}
          detail="Members in commitment"
          icon={<Users size={20} />}
        />
      </div>

      <Card className="mt-4">
        <div className="mb-2 flex justify-between text-sm font-bold">
          <span>
            <T id="Approved progress" />
          </span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </Card>

      {project.status === "draft" && isOwner && (
        <Card className="mt-6 border-ai/25 bg-ai/10">
          <div className="flex gap-3">
            <Brain className="mt-1 text-ai" />
            <div>
              <h2 className="text-xl font-bold">
                {taskRows.length
                  ? "Review the draft AI plan"
                  : "Generate your execution plan"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                <T id="AI turns the commitment into editable tasks with owners, deadlines, acceptance criteria, expected evidence, and risk notes." />
              </p>
            </div>
          </div>
          {taskRows.length ? (
            <HelpCard
              title="You are not locked into this plan"
              tone="cyan"
              className="mt-4"
            >
              <T id="Review the draft before starting. You can edit task names, owners, due dates, and priorities below. Keep evidence requirements concrete so reviewers know what to check." />
            </HelpCard>
          ) : (
            <HelpCard
              title="What happens after generation"
              tone="cyan"
              className="mt-4"
            >
              <T id="Review the plan before starting. You can edit tasks, deadlines, and evidence requirements before the project becomes active." />
            </HelpCard>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <AIPlanGenerationForm
              className="flex-1"
              idempotencyKey={planRequestId}
              label={
                taskRows.length ? "Regenerate AI plan" : "Generate AI plan"
              }
              projectId={id}
            />
            {taskRows.length ? (
              <ButtonLink href="#edit-plan" variant="secondary">
                <T id="Edit plan first" />
              </ButtonLink>
            ) : null}
            {taskRows.length ? (
              <form action={startProject}>
                <input type="hidden" name="project_id" value={id} />
                <Button className="w-full" variant="secondary" type="submit">
                  <T id="Start project with this plan" />
                </Button>
              </form>
            ) : null}
          </div>
        </Card>
      )}

      {project.status === "draft" && taskRows.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_.85fr]">
          <Card>
            <AIRecommendation
              scope="plan"
              mock={reports?.[0]?.model?.startsWith("mock")}
            />
            <SectionHeader
              title="AI plan draft"
              description="The draft should be useful, but your team should still tune it before starting."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {(plan?.phases ?? []).map((phase) => (
                <div
                  key={phase.name}
                  className="rounded-xl border border-border bg-secondary p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-ai">
                    <T id="Phase" />
                  </p>
                  <h3 className="mt-1 font-bold">{phase.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
              ))}
              {(plan?.deliverables ?? []).slice(0, 4).map((deliverable) => (
                <div
                  key={deliverable}
                  className="rounded-xl border border-primary/20 bg-primary/10 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-primary">
                    <T id="Deliverable" />
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6">
                    {deliverable}
                  </p>
                </div>
              ))}
            </div>
            {!plan?.phases?.length && !plan?.deliverables?.length && (
              <p className="text-sm leading-6 text-muted-foreground">
                <T id="Generate or regenerate the AI plan to see phases and deliverables here." />
              </p>
            )}
          </Card>
          <Card
            className={
              planLooksLarge
                ? "border-primary/30 bg-primary/10"
                : "border-ai/25 bg-ai/10"
            }
          >
            <SectionHeader
              title={
                planLooksLarge ? "Plan may be too large" : "Proof expectations"
              }
            />
            <p className="text-sm leading-6 text-muted-foreground">
              {planLooksLarge ? (
                <T
                  id="project.planSize"
                  values={{ count: taskRows.length, days: durationDays }}
                />
              ) : (
                <T id="project.proofExpectations" />
              )}
            </p>
            <div className="mt-4">
              <EvidenceExamples compact />
            </div>
            {plan?.risks?.length ? (
              <div className="mt-4 rounded-xl border border-border bg-background/45 p-3 text-sm">
                <p className="font-bold">
                  <T id="AI risk note" />
                </p>
                <p className="mt-1 text-muted-foreground">{plan.risks[0]}</p>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <SectionHeader
            title="Tasks by status"
            description="Progress only becomes real when submitted evidence is reviewed."
            action={
              <ButtonLink
                href={`/app/projects/${id}/tasks`}
                variant="secondary"
                size="sm"
              >
                <T id="Open board" />
              </ButtonLink>
            }
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statusCounts.map((item) => (
              <div
                key={item.status}
                className="rounded-xl border border-border bg-secondary p-3"
              >
                <StatusBadge status={item.status} />
                <p className="mt-2 text-2xl font-bold">{item.count}</p>
              </div>
            ))}
          </div>
        </Card>

        {plan?.risks?.length ? (
          <AIRecommendation
            scope="plan"
            mock={reports?.[0]?.model?.startsWith("mock")}
          >
            <ul className="list-disc space-y-2 pl-4">
              {plan.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
            {plan.reasoning && <p>{plan.reasoning}</p>}
          </AIRecommendation>
        ) : (
          <HelpCard title="Deadline check">
            <p>
              <T id="project.deadlineCopy" />
            </p>
            <p className="mt-2">
              <T id="project.dueDate" /> <DateText value={project.end_date} />
            </p>
          </HelpCard>
        )}
      </div>

      {taskRows.length ? (
        <section className="mt-8">
          <SectionHeader
            title="Task board"
            description="Todo, in progress, submitted, approved, changes, rejected, and disputed work in one view."
          />
          <TaskBoard tasks={boardTasks} />
        </section>
      ) : (
        <section className="mt-8">
          <EmptyState
            title="No tasks yet"
            copy="Tasks will appear after the owner generates an AI plan. The plan is editable before the project starts."
            action={
              project.status === "draft" && isOwner ? (
                <AIPlanGenerationForm
                  idempotencyKey={planRequestId}
                  label="Generate AI plan"
                  projectId={id}
                />
              ) : null
            }
          />
        </section>
      )}

      {project.status === "draft" && isOwner && taskRows.length ? (
        <section className="mt-8" id="edit-plan">
          <SectionHeader
            title="Edit plan before starting"
            description="Adjust owner, due date, and priority before starting the project. Acceptance criteria and proof expectations stay visible while you edit."
          />
          <div className="grid gap-3">
            {taskRows.map((task) => {
              const assignment = singleRelation(
                task.task_assignments as unknown as Assignment | Assignment[],
              );
              return (
                <Card key={task.id}>
                  <form
                    action={updateDraftTask}
                    className="grid gap-3 sm:grid-cols-[1fr_10rem_9rem]"
                  >
                    <input type="hidden" name="project_id" value={id} />
                    <input type="hidden" name="task_id" value={task.id} />
                    <label>
                      <T id="Task" />
                      <input name="title" defaultValue={task.title} required />
                    </label>
                    <label>
                      <T id="Due" />
                      <input
                        name="due_date"
                        type="date"
                        defaultValue={task.due_date}
                        required
                      />
                    </label>
                    <label>
                      <T id="Priority" />
                      <select name="priority" defaultValue={task.priority}>
                        <option value="low">
                          <T id="low" />
                        </option>
                        <option value="medium">
                          <T id="medium" />
                        </option>
                        <option value="high">
                          <T id="high" />
                        </option>
                        <option value="critical">
                          <T id="critical" />
                        </option>
                      </select>
                    </label>
                    <label className="sm:col-span-2">
                      <T id="Assignee" />
                      <select
                        name="assigned_user_id"
                        defaultValue={assignment?.user_id}
                      >
                        {profiles?.map((profile) => (
                          <option key={profile.user_id} value={profile.user_id}>
                            {
                              (profile.profiles as unknown as { name: string })
                                .name
                            }
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      className="self-end"
                      type="submit"
                      variant="secondary"
                    >
                      <T id="Save task" />
                    </Button>
                    <div className="sm:col-span-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
                        <p className="font-bold">
                          <T id="Acceptance criteria" />
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {(task.acceptance_criteria ?? []).join("; ") || (
                            <T id="Ask the owner to regenerate the draft with clear acceptance criteria." />
                          )}
                        </p>
                      </div>
                      <div className="rounded-xl border border-ai/20 bg-ai/10 p-3">
                        <p className="font-bold">
                          <T id="Expected evidence" />
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {(task.expected_evidence_types ?? []).join(", ") || (
                            <T id="Proof requirement pending." />
                          )}
                        </p>
                        {assignment?.assigned_reason && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            <T id="Why this member:" />{" "}
                            {assignment.assigned_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </Card>
              );
            })}
          </div>
          <NextActionCard
            className="mt-4"
            titleKey="Start when the draft feels fair"
            copyKey="Once the owners, deadlines, and proof expectations look right, start the project with this plan."
            action={
              <form action={startProject}>
                <input type="hidden" name="project_id" value={id} />
                <Button type="submit">
                  <T id="Start project with this plan" />
                </Button>
              </form>
            }
          />
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionHeader title="Approved assigned tasks" />
          <div className="space-y-4">
            {profiles?.map((profile) => {
              const memberTasks = taskRows.filter((task) => {
                const assignment = singleRelation(
                  task.task_assignments as unknown as Assignment | Assignment[],
                );
                return assignment?.user_id === profile.user_id;
              });
              const memberApproved = memberTasks.filter(
                (task) => task.status === "approved",
              ).length;
              const score = memberTasks.length
                ? Math.round((memberApproved / memberTasks.length) * 100)
                : 0;
              return (
                <div key={profile.user_id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <strong>
                      {(profile.profiles as unknown as { name: string }).name}
                    </strong>
                    <span className="text-muted-foreground">
                      {memberTasks.length ? `${score}%` : "—"}
                    </span>
                  </div>
                  <Progress value={score} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {memberApproved}/{memberTasks.length}{" "}
                    <T id="assigned tasks approved" />
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Recent daily logs"
            action={
              project.status === "active" ? (
                <ButtonLink
                  href={`/app/logs/new?project=${id}`}
                  variant="secondary"
                  size="sm"
                >
                  <T id="Log today" />
                </ButtonLink>
              ) : null
            }
          />
          <div className="space-y-3">
            {logs?.map((log) => (
              <div
                key={log.id}
                className="border-b border-border pb-3 last:border-0"
              >
                <p className="font-bold">
                  {(log.profiles as unknown as { name: string }).name} ·{" "}
                  {log.time_spent_minutes} <T id="min" />
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {log.summary}
                </p>
              </div>
            ))}
            {!logs?.length && (
              <EmptyState
                title="No daily logs yet"
                copy="Daily check-ins should take less than 2 minutes. They help the team see progress before review time."
                action={
                  project.status === "active" ? (
                    <ButtonLink
                      href={`/app/logs/new?project=${id}`}
                      variant="secondary"
                    >
                      <T id="Log today" />
                    </ButtonLink>
                  ) : null
                }
                className="py-7"
              />
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Reviews and disputes"
            action={
              <ButtonLink
                href={`/app/projects/${id}/reviews`}
                variant="secondary"
                size="sm"
              >
                <T id="Review queue" />
              </ButtonLink>
            }
          />
          <div className="space-y-3">
            {pendingReviews.map((task) => (
              <ButtonLink
                key={task.id}
                href={`/app/tasks/${task.id}`}
                variant="secondary"
                className="h-auto w-full justify-between p-3 text-left"
              >
                <span className="font-bold">{task.title}</span>
                <StatusBadge status="submitted" />
              </ButtonLink>
            ))}
            {projectDisputes.map((dispute) => (
              <div
                key={dispute.id}
                className="rounded-xl border border-danger/30 bg-danger/12 p-3 text-sm"
              >
                <strong>
                  {(dispute.tasks as unknown as { title: string }).title}
                </strong>
                <p className="mt-1 text-muted-foreground">{dispute.reason}</p>
              </div>
            ))}
            {!pendingReviews.length && !projectDisputes.length && (
              <EmptyState
                title="No pending approvals"
                copy="Nice. When a teammate submits proof, it will appear here for a quick human review."
                tip="Approve if the proof clearly matches the task."
                className="py-7"
              />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <Card>
          <div className="flex items-start gap-3">
            <Coins className="text-primary" />
            <div>
              <h2 className="font-bold">
                <T id="Virtual pledges" />
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                <T id="Declared commitments only. CommitBet does not hold money." />
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pledges?.map((pledge) => (
              <div
                key={pledge.id}
                className="flex justify-between rounded-xl border border-primary/20 bg-primary/10 p-3"
              >
                <span>
                  {(pledge.profiles as unknown as { name: string }).name}
                </span>
                <strong className="text-primary">
                  {pledge.amount} {pledge.currency}
                </strong>
              </div>
            ))}
          </div>
        </Card>

        {project.status === "active" && isOwner ? (
          <Card className="flex flex-col items-start justify-between gap-4 border-primary/30 bg-primary/10 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <ShieldCheck className="text-primary" />
              <div>
                <h2 className="font-bold">
                  <T id="Ready to close the sprint?" />
                </h2>
                <p className="text-sm text-muted-foreground">
                  <T id="Generate an evidence-based AI final report before confirming virtual pledge outcomes." />
                </p>
              </div>
            </div>
            <ButtonLink href={`/app/projects/${id}/final`}>
              <T id="Final report" />
            </ButtonLink>
          </Card>
        ) : (
          <Card className="flex gap-3">
            <FileCheck2 className="text-ai" />
            <div>
              <h2 className="font-bold">
                <T id="Evidence is the source of truth" />
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <T id="Use task detail pages to attach proof and peer reviews before the final report." />
              </p>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
