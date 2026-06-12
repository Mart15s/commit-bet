import { resolveDispute } from "@/app/(protected)/app/tasks/actions";
import { Button, ButtonLink, Card, ErrorMessage, PageHeader, StatusBadge } from "@/components/ui";
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
      <ButtonLink href={`/app/tasks/${dispute.task_id}`} variant="ghost" size="sm" className="mb-3">Back to task</ButtonLink>
      <PageHeader title={`Dispute: ${task.title}`} description="AI structures the disagreement. A human owner makes the resolution." action={<StatusBadge status={dispute.status} />} />
      <ErrorMessage message={query.error} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card><h2 className="font-black">Performer position</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{dispute.performer_explanation}</p><h3 className="mt-5 text-sm font-black">Reviewer rejection</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{dispute.reviewer_rejection_reason}</p></Card>
        <Card className="border-[#ccd6a0] bg-[#fbffe4]">
          <div className="flex justify-between gap-3"><h2 className="font-black">AI recommendation</h2>{recommendation && <strong>{recommendation.confidence_score}% confidence</strong>}</div>
          {recommendation ? <><p className="mt-3 text-sm leading-6">{recommendation.neutral_summary}</p><div className="mt-4 rounded-xl bg-white p-3"><StatusBadge status={recommendation.recommended_resolution} /><p className="mt-2 text-sm">{recommendation.suggested_next_action}</p></div></> : <p className="mt-3 text-sm text-[var(--muted)]">Recommendation unavailable.</p>}
          <p className="mt-4 text-xs font-bold text-[var(--muted)]">Recommendation only. No financial or pledge action is automatic.</p>
        </Card>
      </div>
      {recommendation && <div className="mt-4 grid gap-4 md:grid-cols-2"><Card><h2 className="font-black text-[#28603a]">Arguments for approval</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{recommendation.arguments_for_approval.map((item) => <li key={item}>{item}</li>)}</ul></Card><Card><h2 className="font-black text-[#922f2f]">Arguments for rejection</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{recommendation.arguments_for_rejection.map((item) => <li key={item}>{item}</li>)}</ul></Card></div>}
      {isOwner && dispute.status === "open" && <Card className="sticky bottom-16 mt-5 md:bottom-3"><h2 className="font-black">Human resolution</h2><form action={resolveDispute} className="mt-3 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="dispute_id" value={id} /><select name="resolution"><option value="approve">Approve</option><option value="needs_changes">Needs changes</option><option value="reject">Reject</option></select><Button className="shrink-0" type="submit">Confirm resolution</Button></form></Card>}
    </>
  );
}

