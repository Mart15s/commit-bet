import { ExternalLink, FileText, ShieldAlert } from "lucide-react";
import { addEvidence, markInProgress, openDispute, reviewTask, submitTask } from "@/app/(protected)/app/tasks/actions";
import { Button, ButtonLink, Card, ErrorMessage, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, singleRelation } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: task } = await supabase
    .from("tasks")
    .select("*, projects(id, title, created_by), task_assignments(user_id, assigned_reason, profiles(name))")
    .eq("id", id)
    .single();
  if (!task) notFound();
  const [{ data: evidence }, { data: reviews }, { data: disputes }] = await Promise.all([
    supabase.from("evidence").select("*, profiles(name)").eq("task_id", id).order("created_at", { ascending: false }),
    supabase.from("reviews").select("*, profiles(name)").eq("task_id", id).order("created_at", { ascending: false }),
    supabase.from("disputes").select("id, status, created_at").eq("task_id", id).order("created_at", { ascending: false }),
  ]);
  const assignment = singleRelation(task.task_assignments as unknown as
    | { user_id: string; assigned_reason: string; profiles: { name: string } }
    | Array<{ user_id: string; assigned_reason: string; profiles: { name: string } }>);
  const isAssignee = assignment?.user_id === user.id;
  const canReview = !isAssignee && task.status === "submitted";
  const criteria = task.acceptance_criteria as string[];

  return (
    <>
      <ButtonLink href={`/app/projects/${(task.projects as unknown as { id: string }).id}`} variant="ghost" size="sm" className="mb-3">Back to project</ButtonLink>
      <PageHeader title={task.title} description={(task.projects as unknown as { title: string }).title} action={<StatusBadge status={task.status} />} />
      <ErrorMessage message={query.error} />
      <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-4">
          <Card>
            <p className="leading-7 text-[var(--muted)]">{task.description}</p>
            <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-[var(--muted)]">Assignee</span><strong className="block">{assignment?.profiles?.name}</strong></div>
              <div><span className="text-[var(--muted)]">Due</span><strong className="block">{formatDate(task.due_date)}</strong></div>
              <div><span className="text-[var(--muted)]">Priority</span><div><StatusBadge status={task.priority} /></div></div>
              <div><span className="text-[var(--muted)]">Why assigned</span><strong className="block">{assignment?.assigned_reason}</strong></div>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-black">Acceptance criteria</h2>
            <ul className="mt-3 space-y-2">{criteria.map((item) => <li className="flex gap-2 text-sm" key={item}><span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--brand)]" />{item}</li>)}</ul>
            <h3 className="mt-5 text-sm font-black">Expected evidence</h3>
            <div className="mt-2 flex flex-wrap gap-2">{task.expected_evidence_types.map((item: string) => <span key={item} className="rounded-full bg-[#edf0eb] px-3 py-1 text-xs font-bold">{item}</span>)}</div>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Evidence ({evidence?.length ?? 0})</h2>
            <div className="mt-4 space-y-3">
              {evidence?.map(async (item) => {
                const path = (item.metadata as { storage_path?: string }).storage_path;
                const signed = path ? await supabase.storage.from("evidence").createSignedUrl(path, 600) : null;
                const url = item.url || signed?.data?.signedUrl;
                return <div key={item.id} className="rounded-xl bg-[#f5f7f3] p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-black capitalize">{item.type}</p><p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p></div><FileText size={20} className="text-[var(--brand)]" /></div>{url && <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-black text-[var(--brand)]">Open evidence <ExternalLink size={14} /></a>}</div>;
              })}
              {!evidence?.length && <p className="text-sm text-[var(--muted)]">No proof has been attached yet.</p>}
            </div>
          </Card>

          {isAssignee && !["submitted", "approved", "disputed"].includes(task.status) && (
            <Card>
              <h2 className="text-lg font-black">Add proof</h2>
              <form action={addEvidence} className="mt-4 grid gap-3">
                <input type="hidden" name="task_id" value={id} />
                <label>Evidence type<select name="type" defaultValue="link"><option>screenshot</option><option>document</option><option>github</option><option>video</option><option>link</option><option>demo</option><option>other</option></select></label>
                <label>Description<textarea name="description" required placeholder="What does this evidence demonstrate?" /></label>
                <label>Link (optional)<input name="url" type="url" placeholder="https://..." /></label>
                <label>File (optional, max 10 MB)<input name="file" type="file" /></label>
                <Button type="submit">Add evidence</Button>
              </form>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {isAssignee && (
            <Card>
              <h2 className="font-black">Your task</h2>
              <div className="mt-4 grid gap-2">
                {["todo", "needs_changes", "rejected"].includes(task.status) && <form action={markInProgress}><input type="hidden" name="task_id" value={id} /><Button className="w-full" variant="secondary">Mark in progress</Button></form>}
                {["in_progress", "needs_changes"].includes(task.status) && <form action={submitTask}><input type="hidden" name="task_id" value={id} /><Button className="w-full">Submit for review</Button></form>}
              </div>
            </Card>
          )}
          {canReview && (
            <Card>
              <h2 className="font-black">Peer review</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Compare the evidence with every acceptance criterion.</p>
              <form action={reviewTask} className="mt-4 grid gap-3">
                <input type="hidden" name="task_id" value={id} />
                <label>Decision<select name="status"><option value="approved">Approve</option><option value="needs_changes">Needs changes</option><option value="rejected">Reject</option></select></label>
                <label>Comment<textarea name="comment" placeholder="Required for changes or rejection" /></label>
                <Button type="submit">Submit review</Button>
              </form>
            </Card>
          )}
          {isAssignee && task.status === "rejected" && !disputes?.some((item) => item.status === "open") && (
            <Card className="border-[#e2c3c3]">
              <div className="flex gap-2"><ShieldAlert className="text-[var(--danger)]" /><h2 className="font-black">Open a dispute</h2></div>
              <form action={openDispute} className="mt-4 grid gap-3">
                <input type="hidden" name="task_id" value={id} />
                <label>Reason<input name="reason" required placeholder="Why should this be reconsidered?" /></label>
                <label>Your explanation<textarea name="performer_explanation" required /></label>
                <Button type="submit" variant="danger">Request AI recommendation</Button>
              </form>
            </Card>
          )}
          <Card>
            <h2 className="font-black">Review history</h2>
            <div className="mt-3 space-y-3">{reviews?.map((review) => <div key={review.id} className="border-b border-[var(--line)] pb-3 last:border-0"><div className="flex justify-between"><strong>{(review.profiles as unknown as { name: string }).name}</strong><StatusBadge status={review.status} /></div>{review.comment && <p className="mt-2 text-sm text-[var(--muted)]">{review.comment}</p>}</div>)}{!reviews?.length && <p className="text-sm text-[var(--muted)]">No reviews yet.</p>}</div>
          </Card>
          {disputes?.map((dispute) => <ButtonLink key={dispute.id} href={`/app/disputes/${dispute.id}`} variant="secondary" className="w-full">View {dispute.status} dispute</ButtonLink>)}
        </div>
      </div>
    </>
  );
}
