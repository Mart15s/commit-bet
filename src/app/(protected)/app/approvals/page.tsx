import { AlertTriangle, Check, FileCheck2, MessageSquare, X } from "lucide-react";
import { reviewTask } from "@/app/(protected)/app/tasks/actions";
import { T } from "@/components/i18n-text";
import { TranslatedTextarea } from "@/components/translated-form";
import { Button, ButtonLink, Card, EmptyState, EvidenceExamples, HelpCard, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { singleRelation } from "@/lib/utils";

type ReviewTask = {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  expected_evidence_types: string[];
  projects: { id: string; title: string } | { id: string; title: string }[] | null;
  task_assignments: { user_id: string; profiles: { name: string } } | Array<{ user_id: string; profiles: { name: string } }> | null;
  evidence: Array<{ id: string; type: string; description: string; url?: string | null }>;
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, projects(id, title), task_assignments(user_id, profiles(name)), evidence(id, type, description, url)")
    .eq("status", "submitted");
  const reviewable = ((tasks ?? []) as unknown as ReviewTask[]).filter((task) => {
    const assignment = singleRelation(task.task_assignments);
    const project = singleRelation(task.projects);
    return assignment?.user_id !== user.id && (!params.project || project?.id === params.project);
  });

  return (
    <>
      <PageHeader
        eyebrow={<T k="review.eyebrow" />}
        title={<T k="review.title" />}
        description={<T k="review.description" />}
      />
      <HelpCard title={<T k="review.checkingTitle" />} tone="amber" className="mb-4">
        <T k="review.checkingCopy" />
      </HelpCard>
      <div className="grid gap-4">
        {reviewable.map((task) => {
          const assignment = singleRelation(task.task_assignments);
          const project = singleRelation(task.projects);
          return (
            <Card key={task.id}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status="submitted" />
                    <span className="text-sm font-bold text-muted-foreground">{project?.title}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-black tracking-[-.02em]">{task.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground"><T k="review.performedBy" /> {assignment?.profiles?.name || <T k="review.teammate" />}</p>
                </div>
                <ButtonLink href={`/app/tasks/${task.id}`} variant="secondary" size="sm"><T k="review.openDetail" /></ButtonLink>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                  <h3 className="flex items-center gap-2 font-black"><FileCheck2 size={18} className="text-cyan-300" /> <T k="review.submittedEvidence" /></h3>
                  <div className="mt-3 space-y-3">
                    {task.evidence?.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                        <p className="font-black capitalize">{item.type}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                        {item.url && <a className="mt-2 inline-block text-sm font-black text-cyan-300" href={item.url} target="_blank" rel="noreferrer"><T k="review.openEvidence" /></a>}
                      </div>
                    ))}
                    {!task.evidence?.length && <p className="text-sm text-muted-foreground"><T k="review.noEvidenceRows" /></p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
                  <h3 className="font-black"><T k="task.acceptanceTitle" /></h3>
                  <ul className="mt-3 space-y-2">
                    {(task.acceptance_criteria ?? []).map((criterion) => <li key={criterion} className="flex gap-2 text-sm leading-6"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-300" />{criterion}</li>)}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(task.expected_evidence_types ?? []).map((item) => <span key={item} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-black text-muted-foreground">{item}</span>)}
                  </div>
                  {!(task.expected_evidence_types ?? []).length && <div className="mt-4"><EvidenceExamples compact /></div>}
                </div>
              </div>

              <form action={reviewTask} className="mt-5 grid gap-3">
                <input type="hidden" name="task_id" value={task.id} />
                <label><span className="inline-flex items-center gap-2"><MessageSquare size={16} /> <T k="review.note" /></span><small className="font-normal text-muted-foreground"><T k="review.noteHelp" /></small><TranslatedTextarea name="comment" className="min-h-20" placeholderKey="review.notePlaceholder" /></label>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Button name="status" value="approved" type="submit"><Check size={17} /> <T k="review.approveWork" /></Button>
                  <Button name="status" value="needs_changes" type="submit" variant="amber"><T k="review.requestChanges" /></Button>
                  <Button name="status" value="rejected" type="submit" variant="danger"><X size={17} /> <T k="review.rejectProof" /></Button>
                  <ButtonLink href={`/app/tasks/${task.id}`} variant="secondary"><AlertTriangle size={17} /> <T k="review.viewDisputePath" /></ButtonLink>
                </div>
              </form>
            </Card>
          );
        })}
        {!reviewable.length && (
          <EmptyState
            title={<T k="dashboard.nothingToReview" />}
            copy={<T k="review.emptyCopy" />}
            tip={<T k="review.emptyTip" />}
            action={<ButtonLink href="/app" variant="secondary"><T k="review.backDashboard" /></ButtonLink>}
          />
        )}
      </div>
    </>
  );
}
