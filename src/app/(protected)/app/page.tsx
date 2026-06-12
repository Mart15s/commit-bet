import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, singleRelation } from "@/lib/utils";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const [{ data: projects }, { data: assignments }, { data: submitted }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("task_assignments").select("tasks(*, projects(title))").eq("user_id", user.id),
    supabase.from("tasks").select("*, task_assignments(user_id), projects(title)").eq("status", "submitted"),
  ]);
  const active = projects?.filter((project) => project.status === "active") ?? [];
  const myTasks = (assignments ?? []).map((row) => row.tasks as unknown as { id: string; title: string; due_date: string; status: string; projects: { title: string } }).filter((task) => task.status !== "approved");
  const approvals = (submitted ?? []).filter((task) => {
    const assigned = singleRelation(task.task_assignments as unknown as { user_id: string } | Array<{ user_id: string }>);
    return assigned?.user_id !== user.id;
  });

  return (
    <>
      <PageHeader title="Your commitments" description="Today’s work, pending proof, and the sprints your team promised to finish." action={<ButtonLink href="/app/projects/new">New project</ButtonLink>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-sm font-bold text-[var(--muted)]">Active projects</p><p className="mt-1 text-3xl font-black">{active.length}</p></Card>
        <Card><p className="text-sm font-bold text-[var(--muted)]">Assigned tasks</p><p className="mt-1 text-3xl font-black">{myTasks.length}</p></Card>
        <Card><p className="text-sm font-bold text-[var(--muted)]">Pending approvals</p><p className="mt-1 text-3xl font-black">{approvals.length}</p></Card>
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-2xl font-black">Active projects</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((project) => <ButtonLink key={project.id} href={`/app/projects/${project.id}`} variant="secondary" className="h-auto justify-start p-0 text-left"><Card className="w-full border-0"><div className="flex justify-between gap-3"><div><h3 className="text-lg font-black">{project.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">Ends {formatDate(project.end_date)}</p></div><StatusBadge status={project.status} /></div></Card></ButtonLink>)}
          {!active.length && <div className="sm:col-span-2"><EmptyState title="No active sprint" copy="Create a project, generate its plan, and make the commitment real." action={<ButtonLink href="/app/projects/new">Create project</ButtonLink>} /></div>}
        </div>
      </section>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section><h2 className="mb-3 text-xl font-black">Your open tasks</h2><div className="space-y-3">{myTasks.slice(0, 5).map((task) => <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto w-full justify-between p-4 text-left"><span><strong className="block">{task.title}</strong><small className="text-[var(--muted)]">{task.projects.title}</small></span><StatusBadge status={task.status} /></ButtonLink>)}{!myTasks.length && <Card className="text-sm text-[var(--muted)]">Nothing assigned right now.</Card>}</div></section>
        <section><h2 className="mb-3 text-xl font-black">Needs your review</h2><div className="space-y-3">{approvals.slice(0, 5).map((task) => <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto w-full justify-between p-4 text-left"><span><strong className="block">{task.title}</strong><small className="text-[var(--muted)]">{(task.projects as unknown as { title: string }).title}</small></span><StatusBadge status="submitted" /></ButtonLink>)}{!approvals.length && <Card className="text-sm text-[var(--muted)]">No submissions are waiting.</Card>}</div></section>
      </div>
    </>
  );
}
