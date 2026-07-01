import { Brain, Check, ExternalLink, FileText, MessageSquare, ShieldAlert, Upload, X } from "lucide-react";
import { addEvidence, markInProgress, openDispute, reviewTask, submitTask } from "@/app/(protected)/app/tasks/actions";
import { T } from "@/components/i18n-text";
import { TranslatedInput, TranslatedSelect, TranslatedTextarea } from "@/components/translated-form";
import { Button, ButtonLink, Card, EmptyState, ErrorMessage, EvidenceExamples, HelpCard, PageHeader, StatusBadge } from "@/components/ui";
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
  const criteria = (task.acceptance_criteria ?? []) as string[];
  const expectedEvidence = (task.expected_evidence_types ?? []) as string[];

  return (
    <>
      <ButtonLink href={`/app/projects/${(task.projects as unknown as { id: string }).id}`} variant="ghost" size="sm" className="mb-3"><T k="task.backProject" /></ButtonLink>
      <PageHeader title={task.title} description={(task.projects as unknown as { title: string }).title} action={<StatusBadge status={task.status} />} />
      <ErrorMessage message={query.error} />
      <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-4">
          <Card>
            <p className="leading-7 text-muted-foreground">{task.description}</p>
            <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground"><T k="task.assignee" /></span><strong className="block">{assignment?.profiles?.name}</strong></div>
              <div><span className="text-muted-foreground"><T k="task.due" /></span><strong className="block">{formatDate(task.due_date)}</strong></div>
              <div><span className="text-muted-foreground"><T k="task.priority" /></span><div><StatusBadge status={task.priority} /></div></div>
              <div><span className="text-muted-foreground"><T k="task.whyAssigned" /></span><strong className="block">{assignment?.assigned_reason}</strong></div>
            </div>
          </Card>
          <Card className="border-primary/25">
            <h2 className="text-lg font-black"><T k="task.acceptanceTitle" /></h2>
            <p className="mt-1 text-sm text-muted-foreground"><T k="task.acceptanceCopy" /></p>
            <ul className="mt-3 space-y-2">{criteria.map((item) => <li className="flex gap-2 text-sm leading-6" key={item}><span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul>
            {!criteria.length && <p className="mt-3 text-sm text-muted-foreground"><T k="task.noCriteria" /></p>}
            <h3 className="mt-5 text-sm font-black"><T k="task.expectedEvidence" /></h3>
            <p className="mt-1 text-sm text-muted-foreground"><T k="task.expectedEvidenceCopy" /></p>
            <div className="mt-2 flex flex-wrap gap-2">{expectedEvidence.map((item: string) => <span key={item} className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">{item}</span>)}</div>
            {!expectedEvidence.length && <div className="mt-3"><EvidenceExamples compact /></div>}
          </Card>

          <Card className="border-cyan-300/25 bg-cyan-400/10">
            <h2 className="text-lg font-black"><T k="task.evidence" /> ({evidence?.length ?? 0})</h2>
            <p className="mt-1 text-sm text-muted-foreground"><T k="task.evidenceCopy" /></p>
            <div className="mt-4 space-y-3">
              {evidence?.map(async (item) => {
                const path = (item.metadata as { storage_path?: string }).storage_path;
                const signed = path ? await supabase.storage.from("evidence").createSignedUrl(path, 600) : null;
                const url = item.url || signed?.data?.signedUrl;
                return <div key={item.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-2"><div><StatusBadge status={item.type} /><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><FileText size={20} className="text-cyan-300" /></div>{url && <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-black text-cyan-300"><T k="review.openEvidence" /> <ExternalLink size={14} /></a>}</div>;
              })}
              {!evidence?.length && (
                <EmptyState
                  title={<T k="task.noProofTitle" />}
                  copy={<T k="task.noProofCopy" />}
                  tip={<T k="task.noProofTip" />}
                  className="py-7"
                />
              )}
            </div>
          </Card>

          {isAssignee && !["submitted", "approved", "disputed"].includes(task.status) && (
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-black"><Upload size={19} className="text-cyan-300" /> <T k="task.submitEvidence" /></h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground"><T k="task.submitEvidenceCopy" /></p>
              <div className="mt-3"><EvidenceExamples compact /></div>
              <form action={addEvidence} className="mt-4 grid gap-3">
                <input type="hidden" name="task_id" value={id} />
                <label><T k="task.proofType" /><TranslatedSelect name="type" defaultValue="link" options={[
                  { value: "screenshot", labelKey: "status.screenshot" },
                  { value: "document", labelKey: "status.document" },
                  { value: "github", labelKey: "status.github" },
                  { value: "video", labelKey: "status.video" },
                  { value: "link", labelKey: "status.link" },
                  { value: "demo", labelKey: "status.demo" },
                  { value: "other", labelKey: "status.other" },
                ]} /></label>
                <label><T k="task.proveLabel" /><TranslatedTextarea name="description" required placeholderKey="task.provePlaceholder" /></label>
                <label><T k="task.proofLink" /><TranslatedInput name="url" type="url" placeholderKey="daily.proofPlaceholder" /></label>
                <label><T k="task.proofFile" /><input name="file" type="file" /></label>
                <Button type="submit"><T k="task.addProof" /></Button>
              </form>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {isAssignee && (
            <Card>
              <h2 className="font-black"><T k="task.yourTask" /></h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground"><T k="task.yourTaskCopy" /></p>
              <div className="mt-4 grid gap-2">
                {["todo", "needs_changes", "rejected"].includes(task.status) && <form action={markInProgress}><input type="hidden" name="task_id" value={id} /><Button className="w-full" variant="secondary"><T k="task.markInProgress" /></Button></form>}
                {["in_progress", "needs_changes"].includes(task.status) && <form action={submitTask}><input type="hidden" name="task_id" value={id} /><Button className="w-full"><T k="task.submitForReview" /></Button></form>}
              </div>
            </Card>
          )}
          {canReview && (
            <Card>
              <h2 className="font-black"><T k="task.peerReview" /></h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground"><T k="task.peerReviewCopy" /></p>
              <HelpCard title={<T k="task.reviewerGuide" />} tone="amber" className="mt-3">
                <T k="review.checkingCopy" />
              </HelpCard>
              <form action={reviewTask} className="mt-4 grid gap-3">
                <input type="hidden" name="task_id" value={id} />
                <label><span className="inline-flex items-center gap-2"><MessageSquare size={16} /> <T k="review.reason" /></span><small className="font-normal text-muted-foreground"><T k="review.reasonHelp" /></small><TranslatedTextarea name="comment" placeholderKey="review.reasonPlaceholder" /></label>
                <div className="grid gap-2">
                  <Button name="status" value="approved" type="submit" className="w-full"><Check size={17} /> <T k="review.approveWork" /></Button>
                  <Button name="status" value="needs_changes" type="submit" variant="amber" className="w-full"><T k="review.requestChanges" /></Button>
                  <Button name="status" value="rejected" type="submit" variant="danger" className="w-full"><X size={17} /> <T k="review.rejectProof" /></Button>
                </div>
              </form>
            </Card>
          )}
          <Card>
            <div className="flex gap-3">
              <Brain className="mt-1 text-cyan-300" />
              <div>
                <h2 className="font-black"><T k="task.aiReviewerNotes" /></h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  <T k="task.aiReviewerNotesCopy" />
                </p>
              </div>
            </div>
          </Card>
          {isAssignee && task.status === "rejected" && !disputes?.some((item) => item.status === "open") && (
            <Card className="border-red-400/30 bg-red-500/10">
              <div className="flex gap-2"><ShieldAlert className="text-red-300" /><h2 className="font-black"><T k="task.openDispute" /></h2></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground"><T k="task.openDisputeCopy" /></p>
              <form action={openDispute} className="mt-4 grid gap-3">
                <input type="hidden" name="task_id" value={id} />
                <label><T k="task.disputeReason" /><TranslatedInput name="reason" required placeholderKey="task.disputeReasonPlaceholder" /></label>
                <label><T k="task.disputeExplanation" /><TranslatedTextarea name="performer_explanation" required placeholderKey="task.disputeExplanationPlaceholder" /></label>
                <Button type="submit" variant="danger"><T k="task.askAiDispute" /></Button>
              </form>
            </Card>
          )}
          <Card>
            <h2 className="font-black"><T k="task.reviewHistory" /></h2>
            <div className="mt-3 space-y-3">{reviews?.map((review) => <div key={review.id} className="border-b border-border pb-3 last:border-0"><div className="flex justify-between"><strong>{(review.profiles as unknown as { name: string }).name}</strong><StatusBadge status={review.status} /></div>{review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}</div>)}{!reviews?.length && <p className="text-sm text-muted-foreground"><T k="task.noReviews" /></p>}</div>
          </Card>
          {disputes?.map((dispute) => <ButtonLink key={dispute.id} href={`/app/disputes/${dispute.id}`} variant="secondary" className="w-full"><T k="task.viewDispute" /> <StatusBadge status={dispute.status} /></ButtonLink>)}
        </div>
      </div>
    </>
  );
}
