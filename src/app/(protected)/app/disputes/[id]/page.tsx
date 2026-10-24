import { LocalizedSelect } from "@/components/localized-fields";
import { AIRecommendation } from "@/components/ai-recommendation";
import { T } from "@/components/language-provider";
import { resolveDispute } from "@/app/(protected)/app/tasks/actions";
import {
  Button,
  ButtonLink,
  Card,
  ErrorMessage,
  HelpCard,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function DisputePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: dispute } = await supabase
    .from("disputes")
    .select("*, tasks(title, project_id, projects(created_by))")
    .eq("id", id)
    .single();
  if (!dispute) notFound();
  const task = dispute.tasks as unknown as {
    title: string;
    project_id: string;
    projects: { created_by: string };
  };
  const recommendation = dispute.ai_recommendation as {
    neutral_summary: string;
    arguments_for_approval: string[];
    arguments_for_rejection: string[];
    missing_information: string[];
    recommended_resolution: string;
    confidence_score: number;
    suggested_next_action: string;
  } | null;
  const isOwner = task.projects.created_by === user.id;
  const { data: report } = await supabase
    .from("ai_reports")
    .select("model")
    .eq("project_id", task.project_id)
    .eq("type", "dispute")
    .contains("input_snapshot", { task_id: dispute.task_id })
    .order("created_at", { ascending: false })
    .limit(1);

  return (
    <>
      <ButtonLink
        href={`/app/tasks/${dispute.task_id}`}
        variant="ghost"
        size="sm"
        className="mb-3"
      >
        <T id="Back to task" />
      </ButtonLink>
      <PageHeader
        eyebrowKey="Dispute resolution"
        title={task.title}
        descriptionKey="AI structures the disagreement and recommends a next step. A human owner confirms the resolution."
        action={<StatusBadge status={dispute.status} />}
      />
      <ErrorMessage message={query.error} />
      <HelpCard title="How disputes work" tone="cyan" className="mt-4">
        <T id="AI helps organize the disagreement, identify missing proof, and suggest a resolution. It does not make the final decision and it never moves money." />
      </HelpCard>
      <div className="mt-4">
        <AIRecommendation
          scope="dispute"
          confidence={recommendation?.confidence_score}
          mock={report?.[0]?.model?.startsWith("mock")}
        />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-bold">
            <T id="Performer explanation" />
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {dispute.performer_explanation}
          </p>
          <h3 className="mt-5 text-sm font-bold">
            <T id="Reviewer reason" />
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {dispute.reviewer_rejection_reason}
          </p>
        </Card>
        <Card className="border-ai/25 bg-ai/10">
          <div className="flex justify-between gap-3">
            <h2 className="font-bold">
              <T id="AI recommendation" />
            </h2>
            {recommendation && (
              <strong>
                {recommendation.confidence_score}
                <T id="% confidence" />
              </strong>
            )}
          </div>
          {recommendation ? (
            <>
              <p className="mt-3 text-sm leading-6">
                {recommendation.neutral_summary}
              </p>
              <div className="mt-4 rounded-xl border border-border bg-card p-3">
                <StatusBadge status={recommendation.recommended_resolution} />
                <p className="mt-2 text-sm">
                  {recommendation.suggested_next_action}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              <T id="Recommendation unavailable." />
            </p>
          )}
          <p className="mt-4 text-xs font-bold text-muted-foreground">
            <T id="Recommendation only. Humans still confirm the task outcome and no financial or pledge action is automatic." />
          </p>
        </Card>
      </div>
      {recommendation && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-bold text-success">
              <T id="Arguments for approval" />
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {recommendation.arguments_for_approval.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-bold text-danger">
              <T id="Arguments for rejection" />
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {recommendation.arguments_for_rejection.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      {recommendation?.missing_information?.length ? (
        <Card className="mt-4">
          <h2 className="font-bold">
            <T id="ai.missing" />
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {recommendation.missing_information.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      {isOwner && dispute.status === "open" && (
        <Card className="submit-dock sticky z-20 mt-5 border-warning/30 bg-warning/10">
          <h2 className="font-bold">
            <T id="Human confirmation required" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <T id="Choose the final task status after reading the proof, reviewer reason, and AI recommendation." />
          </p>
          <form
            action={resolveDispute}
            className="mt-3 flex flex-col gap-3 sm:flex-row"
          >
            <input type="hidden" name="dispute_id" value={id} />
            <LocalizedSelect name="resolution" aria-label="Dispute resolution">
              <option value="approve">
                <T id="Approve task" />
              </option>
              <option value="needs_changes">
                <T id="Request changes" />
              </option>
              <option value="reject">
                <T id="Reject proof" />
              </option>
            </LocalizedSelect>
            <Button className="shrink-0" type="submit">
              <T id="Confirm human resolution" />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
