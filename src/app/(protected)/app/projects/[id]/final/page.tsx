import { CheckCircle2, Scale, TriangleAlert } from "lucide-react";
import { confirmFinalDecision, generateFinal } from "@/app/(protected)/app/projects/[id]/final/actions";
import { Button, ButtonLink, Card, ErrorMessage, PageHeader, StatusBadge } from "@/components/ui";
import { requireProjectOwner } from "@/lib/auth";

export default async function FinalReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, project } = await requireProjectOwner(id);
  const [{ data: reportRows }, { data: pledges }, { data: decision }] = await Promise.all([
    supabase.from("ai_reports").select("output, model, created_at").eq("project_id", id).eq("type", "final").order("created_at", { ascending: false }).limit(1),
    supabase.from("pledges").select("*, profiles(name)").eq("project_id", id),
    supabase.from("final_decisions").select("*").eq("project_id", id).maybeSingle(),
  ]);
  const report = reportRows?.[0]?.output as {
    project_summary: string;
    success_criteria_evaluation: Array<{ criterion: string; status: string; comment: string }>;
    task_statistics: { planned: number; approved: number; rejected: number; disputed: number; late: number };
    member_contributions: Array<{ user_id: string; contribution_score: number; summary: string; strongest_evidence: string[]; issues: string[] }>;
    evidence_quality_score: number;
    delay_analysis: string;
    dispute_summary: string;
    pledge_recommendation: Array<{ user_id: string; pledge_return_percentage: number; reason: string }>;
    reasoning: string;
    confidence_score: number;
  } | undefined;
  const finalActions = decision?.final_action as Record<string, { name: string; return_percentage: number }> | undefined;

  return (
    <>
      <ButtonLink href={`/app/projects/${id}`} variant="ghost" size="sm" className="mb-3">Back to project</ButtonLink>
      <PageHeader title="Final project report" description={`${project.title}. AI recommends; the project owner confirms.`} action={decision ? <StatusBadge status="completed" /> : undefined} />
      <ErrorMessage message={query.error} />
      {!report && <Card className="mt-5 text-center"><Scale className="mx-auto text-[var(--brand)]" size={38} /><h2 className="mt-3 text-xl font-black">Generate the final audit</h2><p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">The report evaluates criteria, task states, evidence counts, delays, disputes, and virtual pledges.</p><form action={generateFinal} className="mt-5"><input type="hidden" name="project_id" value={id} /><Button type="submit">Generate final report</Button></form></Card>}
      {report && (
        <div className="mt-5 space-y-4">
          <Card className="border-[#ccd6a0] bg-[#fbffe4]"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">AI summary</h2><strong>{report.confidence_score}% confidence</strong></div><p className="mt-3 leading-7">{report.project_summary}</p><p className="mt-4 text-xs font-bold text-[var(--muted)]">Recommendation only. Human confirmation is required and CommitBet holds no money.</p></Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{Object.entries(report.task_statistics).map(([label, value]) => <Card key={label} className="p-4"><p className="text-xs font-bold capitalize text-[var(--muted)]">{label}</p><p className="text-2xl font-black">{value}</p></Card>)}</div>
          <Card><h2 className="text-lg font-black">Success criteria</h2><div className="mt-4 space-y-3">{report.success_criteria_evaluation.map((item) => <div key={item.criterion} className="rounded-xl bg-[#f5f7f3] p-4"><div className="flex justify-between gap-3"><strong>{item.criterion}</strong><StatusBadge status={item.status} /></div><p className="mt-2 text-sm text-[var(--muted)]">{item.comment}</p></div>)}</div></Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card><h2 className="font-black">Evidence quality</h2><p className="mt-3 text-4xl font-black">{report.evidence_quality_score}<span className="text-lg text-[var(--muted)]">/100</span></p><p className="mt-3 text-sm text-[var(--muted)]">{report.reasoning}</p></Card>
            <Card><h2 className="font-black">Delays and disputes</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{report.delay_analysis}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{report.dispute_summary}</p></Card>
          </div>
          <Card><h2 className="text-lg font-black">Member contributions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{report.member_contributions.map((member) => { const pledge = pledges?.find((item) => item.user_id === member.user_id); return <div key={member.user_id} className="rounded-xl bg-[#f5f7f3] p-4"><div className="flex justify-between gap-3"><strong>{(pledge?.profiles as unknown as { name: string })?.name}</strong><span className="font-black">{member.contribution_score}/100</span></div><p className="mt-2 text-sm text-[var(--muted)]">{member.summary}</p></div>; })}</div></Card>
          {decision ? (
            <Card className="border-[#b9d6bf] bg-[#eff8f1]"><div className="flex gap-3"><CheckCircle2 className="text-[#28603a]" /><div><h2 className="font-black">Human decision confirmed</h2><p className="mt-1 text-sm text-[var(--muted)]">This manual action is the final recorded outcome.</p></div></div><div className="mt-4 space-y-2">{Object.entries(finalActions ?? {}).map(([userId, action]) => <div key={userId} className="flex justify-between rounded-xl bg-white p-3"><strong>{action.name}</strong><span>Return {action.return_percentage}% pledge</span></div>)}</div></Card>
          ) : (
            <Card className="border-[#e4d09b]">
              <div className="flex gap-3"><TriangleAlert className="text-[#8a6814]" /><div><h2 className="text-lg font-black">Manual final decision</h2><p className="text-sm text-[var(--muted)]">Review the recommendation and set each virtual pledge outcome yourself.</p></div></div>
              <form action={confirmFinalDecision} className="mt-5 grid gap-4">
                <input type="hidden" name="project_id" value={id} />
                {pledges?.map((pledge) => {
                  const recommendation = report.pledge_recommendation.find((item) => item.user_id === pledge.user_id);
                  return <label key={pledge.user_id}>{(pledge.profiles as unknown as { name: string }).name}: pledge return percentage <input name={`return_${pledge.user_id}`} type="number" min={0} max={100} defaultValue={recommendation?.pledge_return_percentage ?? 0} required /><small className="font-normal text-[var(--muted)]">AI suggested {recommendation?.pledge_return_percentage ?? 0}%: {recommendation?.reason}</small></label>;
                })}
                <label className="flex grid-cols-none items-start gap-3 rounded-xl bg-[#fff6d9] p-4"><input className="mt-1 size-5 w-auto" type="checkbox" name="human_confirmation" value="yes" required /><span>I understand this is my team’s manual virtual-pledge decision. No funds are transferred.</span></label>
                <Button type="submit" size="lg">Confirm final decision</Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
