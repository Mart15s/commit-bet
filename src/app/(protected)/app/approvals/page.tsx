import "@/app/workspace.css";
import { WorkspaceCopy } from "@/components/project-workspace";
import { T } from "@/components/language-provider";
import { FileCheck2, ClipboardCheck } from "lucide-react";
import { ReviewForm } from "@/components/review-form";
import {
  ButtonLink,
  Card,
  ErrorMessage,
  EvidenceExamples,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { singleRelation } from "@/lib/utils";

type ReviewTask = {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  expected_evidence_types: string[];
  projects:
    | { id: string; title: string }
    | { id: string; title: string }[]
    | null;
  task_assignments:
    | { user_id: string; profiles: { name: string } }
    | Array<{ user_id: string; profiles: { name: string } }>
    | null;
  evidence: Array<{
    id: string;
    type: string;
    description: string;
    url?: string | null;
  }>;
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select(
      "*, projects(id, title), task_assignments(user_id, profiles(name)), evidence(id, type, description, url)",
    )
    .eq("status", "submitted");
  const reviewable = ((tasks ?? []) as unknown as ReviewTask[]).filter(
    (task) => {
      const project = singleRelation(task.projects);
      return (
        !(
          Array.isArray(task.task_assignments)
            ? task.task_assignments
            : [task.task_assignments]
        ).some((assignment) => assignment?.user_id === user.id) &&
        (!params.project || project?.id === params.project)
      );
    },
  );

  return (
    <>
      <PageHeader
        eyebrowKey="Peer approval"
        titleKey="Review submitted evidence"
        descriptionKey="Compare each claim against acceptance criteria. AI can advise later, but teammates approve the work first."
      />
      <details className="review-guide">
        <summary><ClipboardCheck size={16} /><T id="What reviewers are checking" /></summary>
        <p><T id="Approve if the proof clearly matches the task. Request changes if the work is started but not fully proven. Reject only if the evidence does not support the task." /></p>
      </details>
      {tasksError && <ErrorMessage message="dash.loadError" />}
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
                    <span className="text-sm font-bold text-muted-foreground">
                      {project?.title}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-[-.02em]">
                    {task.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <T id="Performed by" />{" "}
                    {assignment?.profiles?.name || "teammate"}
                  </p>
                </div>
                <ButtonLink
                  href={`/app/tasks/${task.id}`}
                  variant="secondary"
                  size="sm"
                >
                  <T id="Open detail" />
                </ButtonLink>
              </div>

              <div className="review-proof-canvas mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><WorkspaceCopy en="The promise" lt="Pažadas" /></p>
                  <h3 className="font-bold"><T id="Acceptance criteria" /></h3>
                  <ul className="mt-3 space-y-2">
                    {(task.acceptance_criteria ?? []).map((criterion) => (
                      <li
                        key={criterion}
                        className="flex gap-2 text-sm leading-6"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(task.expected_evidence_types ?? []).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  {!(task.expected_evidence_types ?? []).length && (
                    <div className="mt-4">
                      <EvidenceExamples compact />
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-ai/20 bg-ai/10 p-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><WorkspaceCopy en="The proof · awaiting human review" lt="Įrodymai · laukia žmogaus peržiūros" /></p>
                  <h3 className="flex items-center gap-2 font-bold">
                    <FileCheck2 size={18} className="text-ai" />{" "}
                    <T id="Submitted evidence" />
                  </h3>
                  <div className="mt-3 space-y-3">
                    {task.evidence?.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border bg-card p-3"
                      >
                        <p className="font-bold capitalize">{item.type}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                        {!item.url && (
                          <ButtonLink
                            href={`/app/tasks/${task.id}#task-evidence`}
                            variant="ghost"
                            size="sm"
                          >
                            <T id="Open evidence" />
                          </ButtonLink>
                        )}
                        {item.url && (
                          <a
                            className="mt-2 inline-block text-sm font-bold text-ai"
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <T id="Open evidence" />
                          </a>
                        )}
                      </div>
                    ))}
                    {!task.evidence?.length && (
                      <p className="text-sm text-muted-foreground">
                        <T id="No evidence rows were found. Open detail before approving." />
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <ReviewForm taskId={task.id} />
            </Card>
          );
        })}
        {!tasksError && !reviewable.length && (
          <section className="review-queue-empty">
            <div className="flex items-start gap-4"><div className="workspace-draft-icon mb-0 shrink-0"><ClipboardCheck size={20} /></div><div><h2><T id="Nothing to review yet" /></h2><p><T id="Great. No teammate submissions are waiting right now." /></p><p><WorkspaceCopy en="When proof arrives, review the evidence against the agreed criteria." lt="Gavę įrodymus, palyginkite juos su sutartais kriterijais." /></p></div></div>
            <ButtonLink href="/app" variant="secondary"><T id="Back to dashboard" /></ButtonLink>
          </section>
        )}
      </div>
    </>
  );
}
