import { AlertTriangle, CalendarClock, ClipboardCheck, Coins, Gauge, ListChecks, PlusCircle, Target } from "lucide-react";
import { ButtonLink, Card, EmptyState, MetricCard, PageHeader, Progress, SectionHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { sampleProject } from "@/lib/mock-data";
import { formatDate, singleRelation } from "@/lib/utils";

type DashboardTask = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority: string;
  projects: { title: string } | { title: string }[] | null;
  task_assignments?: Array<{ user_id: string }> | { user_id: string } | null;
};

function daysUntil(value: string) {
  const today = new Date();
  const end = new Date(`${value}T00:00:00`);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const [{ data: projects }, { data: assignments }, { data: submitted }, { data: pledges }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("task_assignments").select("tasks(*, projects(title))").eq("user_id", user.id),
    supabase.from("tasks").select("*, task_assignments(user_id), projects(title)").eq("status", "submitted"),
    supabase.from("pledges").select("amount, currency"),
  ]);

  const active = projects?.filter((project) => project.status === "active") ?? [];
  const myTasks = (assignments ?? [])
    .map((row) => row.tasks as unknown as DashboardTask)
    .filter((task) => task && task.status !== "approved")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const approvals = ((submitted ?? []) as unknown as DashboardTask[]).filter((task) => {
    const assigned = singleRelation(task.task_assignments as unknown as { user_id: string } | Array<{ user_id: string }>);
    return assigned?.user_id !== user.id;
  });
  const dueSoon = myTasks.filter((task) => daysUntil(task.due_date) <= 2 && task.status !== "submitted");
  const pledgePoints = (pledges ?? []).reduce((total, pledge) => total + Number(pledge.amount ?? 0), 0);
  const projectPreview = active[0];

  return (
    <>
      <PageHeader
        eyebrow="Command center"
        title="Your commitments"
        description="Today’s work, pending proof, deadline risk, and the sprints your team promised to finish."
        action={<ButtonLink href="/app/projects/new"><PlusCircle size={18} /> New project</ButtonLink>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active projects" value={active.length} detail="Commitment sprints in motion" icon={<Target size={20} />} />
        <MetricCard label="Today’s tasks" value={myTasks.length} detail={myTasks[0] ? `Next due ${formatDate(myTasks[0].due_date)}` : "No task pressure"} icon={<ListChecks size={20} />} />
        <MetricCard label="Pending approvals" value={approvals.length} detail="Submitted work needing review" icon={<ClipboardCheck size={20} />} />
        <MetricCard label="Virtual pledge" value={pledgePoints || sampleProject.pledgePool} detail="Declared points, no real money" icon={<Coins size={20} />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <section>
          <SectionHeader title="Active projects" description="Each card centers the commitment, proof, and remaining risk." />
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((project) => {
              const remaining = daysUntil(project.end_date);
              const progress = Math.max(12, Math.min(88, remaining <= 0 ? 100 : 100 - remaining * 7));
              return (
                <ButtonLink key={project.id} href={`/app/projects/${project.id}`} variant="secondary" className="h-auto justify-start p-0 text-left">
                  <Card className="w-full border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-[-.02em]">{project.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{project.goal}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs font-black text-muted-foreground"><span>Estimated progress</span><span>{progress}%</span></div>
                      <Progress value={progress} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3"><span className="block text-xs font-bold text-amber-200">Deadline</span><strong>{formatDate(project.end_date)}</strong></div>
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3"><span className="block text-xs font-bold text-violet-200">Days left</span><strong>{Math.max(0, remaining)}</strong></div>
                    </div>
                  </Card>
                </ButtonLink>
              );
            })}
            {!active.length && (
              <div className="md:col-span-2">
                <EmptyState title="No active sprint" copy="Create a project, generate its AI plan, and turn the promise into reviewable evidence." action={<ButtonLink href="/app/projects/new">Create project</ButtonLink>} />
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Card className="border-cyan-300/25 bg-cyan-400/10">
            <div className="flex items-start gap-3">
              <Gauge className="mt-1 text-cyan-300" />
              <div>
                <h2 className="font-black">AI risk insight</h2>
                <p className="mt-2 text-sm leading-6 text-cyan-100">
                  {dueSoon.length
                    ? `${dueSoon.length} assigned task${dueSoon.length === 1 ? "" : "s"} are near deadline without approval.`
                    : projectPreview
                      ? "No urgent blocker detected from your assigned queue."
                      : sampleProject.aiRiskInsight.summary}
                </p>
                <p className="mt-3 rounded-xl border border-cyan-300/20 bg-background/50 p-3 text-xs font-bold text-cyan-100">
                  Why: {dueSoon[0] ? `${dueSoon[0].title} is due ${formatDate(dueSoon[0].due_date)} and still ${dueSoon[0].status.replaceAll("_", " ")}.` : sampleProject.aiRiskInsight.why}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="font-black">Team progress signal</h2>
            <div className="mt-4 space-y-3">
              {sampleProject.members.map((member) => (
                <div key={member.id}>
                  <div className="mb-1 flex justify-between text-sm"><strong>{member.name}</strong><span className="text-muted-foreground">{member.contributionScore}%</span></div>
                  <Progress value={member.contributionScore} />
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader title="Today’s task focus" description="Work that should move toward evidence or submission next." />
          <div className="space-y-3">
            {myTasks.slice(0, 6).map((task) => {
              const project = singleRelation(task.projects as unknown as { title: string } | Array<{ title: string }>);
              return (
                <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto w-full justify-between p-4 text-left">
                  <span>
                    <strong className="block">{task.title}</strong>
                    <small className="text-muted-foreground">{project?.title} · due {formatDate(task.due_date)}</small>
                  </span>
                  <StatusBadge status={task.status} />
                </ButtonLink>
              );
            })}
            {!myTasks.length && <Card className="text-sm text-muted-foreground">Nothing assigned right now. Nice and quiet.</Card>}
          </div>
        </section>

        <section>
          <SectionHeader title="Review queue" description="Submitted work that needs human approval before progress counts." />
          <div className="space-y-3">
            {approvals.slice(0, 6).map((task) => {
              const project = singleRelation(task.projects as unknown as { title: string } | Array<{ title: string }>);
              return (
                <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto w-full justify-between p-4 text-left">
                  <span>
                    <strong className="block">{task.title}</strong>
                    <small className="text-muted-foreground">{project?.title}</small>
                  </span>
                  <StatusBadge status="submitted" />
                </ButtonLink>
              );
            })}
            {!approvals.length && <Card className="text-sm text-muted-foreground">No teammate submissions are waiting.</Card>}
          </div>
        </section>
      </div>

      {dueSoon.length ? (
        <Card className="mt-6 border-red-400/30 bg-red-500/12">
          <div className="flex gap-3">
            <AlertTriangle className="text-red-300" />
            <div>
              <h2 className="font-black">Deadline risk</h2>
              <p className="mt-1 text-sm text-muted-foreground">Prioritize proof for {dueSoon.map((task) => task.title).join(", ")}.</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="flex gap-3">
            <CalendarClock className="text-primary" />
            <div>
              <h2 className="font-black">Daily rhythm</h2>
              <p className="mt-1 text-sm text-muted-foreground">Log what changed today, attach evidence, and keep reviews moving.</p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
