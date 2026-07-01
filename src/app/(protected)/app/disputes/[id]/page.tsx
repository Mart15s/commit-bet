import { resolveDispute } from "@/app/(protected)/app/tasks/actions";
import { T } from "@/components/i18n-text";
import { TranslatedSelect } from "@/components/translated-form";
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
    neutral_summary: string;
    arguments_for_approval: string[];
    arguments_for_rejection: string[];
    missing_information: string[];
    recommended_resolution: string;
    confidence_score: number;
    suggested_next_action: string;
  } | null;
  const isOwner = task.projects.created_by === user.id;

  return (
    <>
      <ButtonLink href={`/app/tasks/${dispute.task_id}`} variant="ghost" size="sm" className="mb-3"><T k="dispute.backTask" /></ButtonLink>
      <PageHeader title={<><T k="dispute.titlePrefix" /> {task.title}</>} description={<T k="dispute.description" />} action={<StatusBadge status={dispute.status} />} />
      <ErrorMessage message={query.error} />
      <HelpCard title={<T k="dispute.howTitle" />} tone="cyan" className="mt-4">
        <T k="dispute.howCopy" />
      </HelpCard>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card><h2 className="font-black"><T k="dispute.performer" /></h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{dispute.performer_explanation}</p><h3 className="mt-5 text-sm font-black"><T k="dispute.reviewerReason" /></h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{dispute.reviewer_rejection_reason}</p></Card>
        <Card className="border-cyan-300/25 bg-cyan-400/10">
          <div className="flex justify-between gap-3"><h2 className="font-black"><T k="dispute.aiRecommendation" /></h2>{recommendation && <strong>{recommendation.confidence_score}% <T k="dispute.confidence" /></strong>}</div>
          {recommendation ? <><p className="mt-3 text-sm leading-6">{recommendation.neutral_summary}</p><div className="mt-4 rounded-xl border border-border bg-card p-3"><StatusBadge status={recommendation.recommended_resolution} /><p className="mt-2 text-sm">{recommendation.suggested_next_action}</p></div></> : <p className="mt-3 text-sm text-muted-foreground"><T k="dispute.unavailable" /></p>}
          <p className="mt-4 text-xs font-bold text-muted-foreground"><T k="dispute.recommendationOnly" /></p>
        </Card>
      </div>
      {recommendation && <div className="mt-4 grid gap-4 md:grid-cols-2"><Card><h2 className="font-black text-emerald-300"><T k="dispute.argumentsApproval" /></h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{recommendation.arguments_for_approval.map((item) => <li key={item}>{item}</li>)}</ul></Card><Card><h2 className="font-black text-red-300"><T k="dispute.argumentsRejection" /></h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{recommendation.arguments_for_rejection.map((item) => <li key={item}>{item}</li>)}</ul></Card></div>}
      {isOwner && dispute.status === "open" && <Card className="sticky bottom-16 mt-5 border-amber-300/30 bg-amber-400/10 md:bottom-3"><h2 className="font-black"><T k="final.humanRequiredStatus" /></h2><p className="mt-1 text-sm text-muted-foreground"><T k="dispute.humanConfirmCopy" /></p><form action={resolveDispute} className="mt-3 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="dispute_id" value={id} /><TranslatedSelect name="resolution" aria-label="Dispute resolution" options={[{ value: "approve", labelKey: "dispute.approveTask" }, { value: "needs_changes", labelKey: "review.requestChanges" }, { value: "reject", labelKey: "review.rejectProof" }]} /><Button className="shrink-0" type="submit"><T k="dispute.confirmResolution" /></Button></form></Card>}
    </>
  );
}
