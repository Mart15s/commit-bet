import { Brain, CheckCircle2, FileCheck2, Gauge, Scale, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { confirmFinalDecision, generateFinal } from "@/app/(protected)/app/projects/[id]/final/actions";
import { Button, ButtonLink, Card, ErrorMessage, MetricCard, PageHeader, Progress, SectionHeader, StatusBadge } from "@/components/ui";
import { T } from "@/i18n/useTranslation";
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
      <ButtonLink href={`/app/projects/${id}`} variant="ghost" size="sm" className="mb-3"><T k="finalReport.back" /></ButtonLink>
      <PageHeader
        eyebrow={<T k="finalReport.eyebrow" />}
        title={<T k="finalReport.title" />}
        description={<T k="finalReport.description" params={{ title: project.title }} />}
        action={decision ? <StatusBadge status="completed" /> : <StatusBadge status="human confirmation required" />}
      />
      <ErrorMessage message={query.error} />

      {!report && (
        <Card className="mt-5 border-cyan-300/25 bg-cyan-400/10 text-center">
          <Scale className="mx-auto text-cyan-300" size={42} />
          <h2 className="mt-4 text-2xl font-black tracking-[-.03em]"><T k="finalReport.generateTitle" /></h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            <T k="finalReport.generateCopy" />
          </p>
          <form action={generateFinal} className="mt-6">
            <input type="hidden" name="project_id" value={id} />
            <Button type="submit" size="lg"><Brain size={18} /> <T k="finalReport.generateButton" /></Button>
          </form>
        </Card>
      )}

      {report && (
        <div className="mt-5 space-y-6">
          <Card className="border-cyan-300/25 bg-cyan-400/10">
            <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-cyan-300"><Brain size={16} /> <T k="finalReport.recommendationEyebrow" /></div>
                <h2 className="mt-3 text-2xl font-black tracking-[-.035em]"><T k="finalReport.aiSummary" /></h2>
                <p className="mt-3 leading-7">{report.project_summary}</p>
                <p className="mt-4 rounded-xl border border-cyan-300/20 bg-background/55 p-3 text-sm font-bold text-cyan-100"><T k="common.why" />: {report.reasoning}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between"><span className="font-black"><T k="common.confidence" /></span><strong>{report.confidence_score}%</strong></div>
                <Progress value={report.confidence_score} className="mt-3" />
                <p className="mt-4 text-xs font-bold text-muted-foreground"><T k="finalReport.confidenceCopy" /></p>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={<T k="finalReport.plannedTasks" />} value={report.task_statistics.planned} icon={<FileCheck2 size={20} />} />
            <MetricCard label={<T k="finalReport.approved" />} value={report.task_statistics.approved} icon={<CheckCircle2 size={20} />} />
            <MetricCard label={<T k="finalReport.disputed" />} value={report.task_statistics.disputed} icon={<TriangleAlert size={20} />} />
            <MetricCard label={<T k="finalReport.evidenceQuality" />} value={`${report.evidence_quality_score}/100`} icon={<Gauge size={20} />} />
          </div>

          <Card>
            <SectionHeader title={<T k="finalReport.successEvaluation" />} description={<T k="finalReport.successEvaluationCopy" />} />
            <div className="grid gap-3">
              {report.success_criteria_evaluation.map((item) => (
                <div key={item.criterion} className="rounded-xl border border-border bg-secondary p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <strong>{item.criterion}</strong>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.comment}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeader title={<T k="finalReport.memberScores" />} />
              <div className="space-y-4">
                {report.member_contributions.map((member) => {
                  const pledge = pledges?.find((item) => item.user_id === member.user_id);
                  const name = (pledge?.profiles as unknown as { name: string } | undefined)?.name || member.user_id;
                  return (
                    <div key={member.user_id}>
                      <div className="mb-1 flex justify-between text-sm"><strong>{name}</strong><span className="text-muted-foreground">{member.contribution_score}/100</span></div>
                      <Progress value={member.contribution_score} />
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{member.summary}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <SectionHeader title={<T k="finalReport.delayDisputeAnalysis" />} />
              <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p><strong className="text-foreground"><T k="finalReport.delayAnalysis" /></strong> {report.delay_analysis}</p>
                <p><strong className="text-foreground"><T k="finalReport.disputeSummary" /></strong> {report.dispute_summary}</p>
              </div>
            </Card>
          </div>

          {decision ? (
            <Card className="border-emerald-400/30 bg-emerald-400/10">
              <div className="flex gap-3"><CheckCircle2 className="text-emerald-300" /><div><h2 className="font-black"><T k="finalReport.humanConfirmed" /></h2><p className="mt-1 text-sm text-muted-foreground"><T k="finalReport.humanConfirmedCopy" /></p></div></div>
              <div className="mt-4 space-y-2">{Object.entries(finalActions ?? {}).map(([userId, action]) => <div key={userId} className="flex justify-between rounded-xl border border-border bg-card p-3"><strong>{action.name}</strong><span><T k="common.returnPledge" params={{ percentage: action.return_percentage }} /></span></div>)}</div>
            </Card>
          ) : (
            <Card className="border-amber-300/30 bg-amber-400/10">
              <div className="flex gap-3">
                <ShieldCheck className="text-amber-300" />
                <div>
                  <h2 className="text-lg font-black"><T k="finalReport.humanRequired" /></h2>
                  <p className="text-sm leading-6 text-muted-foreground"><T k="finalReport.humanRequiredCopy" /></p>
                </div>
              </div>
              <form action={confirmFinalDecision} className="mt-5 grid gap-4">
                <input type="hidden" name="project_id" value={id} />
                {pledges?.map((pledge) => {
                  const recommendation = report.pledge_recommendation.find((item) => item.user_id === pledge.user_id);
                  return (
                    <label key={pledge.user_id}>
                      {(pledge.profiles as unknown as { name: string }).name}: <T k="finalReport.pledgeReturnPercentage" />
                      <input name={`return_${pledge.user_id}`} type="number" min={0} max={100} defaultValue={recommendation?.pledge_return_percentage ?? 0} required />
                      <small className="font-normal text-muted-foreground"><T k="finalReport.aiSuggested" params={{ percentage: recommendation?.pledge_return_percentage ?? 0, reason: recommendation?.reason ?? "" }} /></small>
                    </label>
                  );
                })}
                <label className="flex grid-cols-none items-start gap-3 rounded-xl border border-amber-300/30 bg-background/45 p-4">
                  <input className="mt-1 size-5 w-auto" type="checkbox" name="human_confirmation" value="yes" required />
                  <span><T k="finalReport.confirmationCheckbox" /></span>
                </label>
                <Button type="submit" size="lg"><Users size={18} /> <T k="finalReport.confirmDecision" /></Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
