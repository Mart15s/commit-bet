import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { singleRelation } from "@/lib/utils";

export default async function ApprovalsPage() {
  const { supabase, user } = await requireUser();
  const { data: tasks } = await supabase.from("tasks").select("*, projects(title), task_assignments(user_id, profiles(name))").eq("status", "submitted");
  const reviewable = (tasks ?? []).filter((task) => {
    const assignment = singleRelation(task.task_assignments as unknown as { user_id: string } | Array<{ user_id: string }>);
    return assignment?.user_id !== user.id;
  });
  return (
    <>
      <PageHeader title="Pending approvals" description="Peer review turns a task claim into verified progress." />
      <div className="grid gap-3 sm:grid-cols-2">
        {reviewable.map((task) => <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto justify-start p-0 text-left"><Card className="w-full border-0"><div className="flex justify-between gap-3"><div><h2 className="font-black">{task.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{(task.projects as unknown as { title: string }).title}</p></div><StatusBadge status="submitted" /></div></Card></ButtonLink>)}
        {!reviewable.length && <div className="sm:col-span-2"><EmptyState title="Inbox cleared" copy="No teammate submissions are waiting for your review." /></div>}
      </div>
    </>
  );
}
