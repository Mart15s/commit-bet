import { resolveDispute } from "@/app/(protected)/app/tasks/actions";
import { AIRecommendationNotice, DisputeAIRecommendationButton } from "@/components/ai-controls";
import { Button, ButtonLink, Card, ErrorMessage, HelpCard, PageHeader, StatusBadge } from "@/components/ui";
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
  const { data: dispute } = await supabase.from("disputes").select("*, tasks(title, project_id, projects(created_by))").eq("id", id).single();
  if (!dispute) notFound();
  const task = dispute.tasks as unknown as { title: string; project_id: string; projects: { created_by: string } };
  const recommendation = dispute.ai_recommendation as {
    neutralSummary: string;
    argumentsForApproval: string[];
    argumentsForRejection: string[];
    missingInformation: string[];
    recommendedResolution: string;
    confidence: number;
    suggestedNextAction: string;
    reasoning: string;
  } | null;
  const isOwner = task.projects.created_by === user.id;

  return (
    <>
      <ButtonLink href={`/app/tasks/${dispute.task_id}`} variant="ghost" size="sm" className="mb-3">Back to task</ButtonLink>
      <PageHeader title={`Dispute: ${task.title}`} description="AI structures the disagreement and recommends a next step. A human owner confirms the resolution." action={<StatusBadge status={dispute.status} />} />
      <ErrorMessage message={query.error} />
      <HelpCard title="How disputes work" tone="cyan" className="mt-4">
        AI helps organize the disagreement, identify missing proof, and suggest a resolution. It does not make the final decision and it never moves money.
      </HelpCard>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card><h2 className="font-black">Performer explanation</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{dispute.performer_explanation}</p><h3 className="mt-5 text-sm font-black">Reviewer reason</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{dispute.reviewer_rejection_reason}</p></Card>
        <Card className="border-cyan-300/25 bg-cyan-400/10">
          <div className="flex justify-between gap-3"><h2 className="font-black">AI recommendation</h2>{recommendation && <strong>{recommendation.confidence}% confidence</strong>}</div>
          {recommendation ? <><p className="mt-3 text-sm leading-6">{recommendation.neutralSummary}</p><div className="mt-4 rounded-xl border border-border bg-card p-3"><StatusBadge status={recommendation.recommendedResolution} /><p className="mt-2 text-sm">{recommendation.suggestedNextAction}</p><p className="mt-2 text-xs text-muted-foreground">{recommendation.reasoning}</p></div></> : <p className="mt-3 text-sm text-muted-foreground">Recommendation unavailable.</p>}
          {dispute.status === "open" ? <DisputeAIRecommendationButton disputeId={id} /> : null}
          <AIRecommendationNotice />
        </Card>
      </div>
      {recommendation && <div className="mt-4 grid gap-4 md:grid-cols-2"><Card><h2 className="font-black text-emerald-300">Arguments for approval</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{recommendation.argumentsForApproval.map((item) => <li key={item}>{item}</li>)}</ul></Card><Card><h2 className="font-black text-red-300">Arguments for rejection</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{recommendation.argumentsForRejection.map((item) => <li key={item}>{item}</li>)}</ul></Card></div>}
      {isOwner && dispute.status === "open" && <Card className="sticky bottom-16 mt-5 border-amber-300/30 bg-amber-400/10 md:bottom-3"><h2 className="font-black">Human confirmation required</h2><p className="mt-1 text-sm text-muted-foreground">Choose the final task status after reading the proof, reviewer reason, and AI recommendation.</p><form action={resolveDispute} className="mt-3 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="dispute_id" value={id} /><select name="resolution" aria-label="Dispute resolution"><option value="approve">Approve task</option><option value="needs_changes">Request changes</option><option value="reject">Reject proof</option></select><Button className="shrink-0" type="submit">Confirm human resolution</Button></form></Card>}
    </>
  );
}
