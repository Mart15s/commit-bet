import { Brain, CheckCircle2, FileCheck2, Gauge, Scale, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { confirmFinalDecision, generateFinal } from "@/app/(protected)/app/projects/[id]/final/actions";
import { AISubmitButton } from "@/components/ai-controls";
import { Button, ButtonLink, Card, ErrorMessage, HelpCard, MetricCard, PageHeader, Progress, SectionHeader, StatusBadge } from "@/components/ui";
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
    projectSummary: string;
    successCriteriaEvaluation: Array<{ criterion: string; status: string; reasoning: string }>;
    taskStatistics: { total: number; approved: number; rejected: number; needsChanges: number; disputed: number; overdue: number };
    memberContributions: Array<{
      userId: string;
      contributionScore: number;
      strengthsObserved: string[];
      issues: string[];
      evidenceQuality: number;
      consistency: number;
      reasoning: string;
      pledgeRecommendation: { recommendedReturnPercentage: number; reasoning: string };
    }>;
    evidenceQualityAnalysis: string;
    delayAnalysis: string;
    disputeSummary: string;
    finalRecommendation: string;
    projectSuccessScore: number;
    confidence: number;
    humanConfirmationNotice: string;
  } | undefined;
  const finalActions = decision?.final_action as Record<string, { name: string; return_percentage: number }> | undefined;
  const metCount = report?.successCriteriaEvaluation.filter((item) => item.status === "achieved").length ?? 0;
  const totalCriteria = report?.successCriteriaEvaluation.length ?? 0;
  const outcome = !report
    ? "Needs manual review"
    : report.taskStatistics.total === 0
      ? "Needs manual review"
      : report.taskStatistics.approved === 0
        ? "Not completed"
        : report.taskStatistics.disputed > 0 || report.confidence < 60
          ? "Needs manual review"
          : totalCriteria && metCount === totalCriteria
            ? "Success"
            : "Partial success";

  return (
    <>
      <ButtonLink href={`/app/projects/${id}`} variant="ghost" size="sm" className="mb-3">Back to project</ButtonLink>
      <PageHeader
        eyebrow="AI final report"
        title="Final project report"
        description={`${project.title}. AI recommends with reasons; the project owner confirms the final virtual-pledge outcome.`}
        action={decision ? <StatusBadge status="completed" /> : <StatusBadge status="human confirmation required" />}
      />
      <ErrorMessage message={query.error} />

      {!report && (
        <Card className="mt-5 border-cyan-300/25 bg-cyan-400/10 text-center">
          <Scale className="mx-auto text-cyan-300" size={42} />
          <h2 className="mt-4 text-2xl font-black tracking-[-.03em]">No final report yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            The report appears after you generate an evidence audit. It evaluates success criteria, task statistics, member contribution, evidence quality, delay patterns, disputes, and virtual pledge recommendations.
          </p>
          <p className="mx-auto mt-4 max-w-xl rounded-xl border border-cyan-300/20 bg-background/45 p-3 text-sm font-bold text-cyan-100">
            Human confirmation is still required after AI recommends an outcome.
          </p>
          <form action={generateFinal} className="mt-6">
            <input type="hidden" name="project_id" value={id} />
            <AISubmitButton labelKey="ai.generateFinalReport" pendingKey="ai.generatingFinalReport" />
          </form>
        </Card>
      )}

      {report && (
        <div className="mt-5 space-y-6">
          <Card className="border-cyan-300/25 bg-cyan-400/10">
            <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-cyan-300"><Brain size={16} /> AI recommendation</div>
                <h2 className="mt-3 text-3xl font-black tracking-[-.035em]">{outcome}</h2>
                <p className="mt-3 leading-7">{report.projectSummary}</p>
                <p className="mt-4 rounded-xl border border-cyan-300/20 bg-background/55 p-3 text-sm font-bold text-cyan-100"><span className="text-foreground">Why AI thinks this:</span> {report.finalRecommendation}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between"><span className="font-black">Project success</span><strong>{report.projectSuccessScore}%</strong></div>
                <Progress value={report.projectSuccessScore} className="mt-3" />
                <div className="mt-4 flex items-center justify-between"><span className="font-black">Confidence</span><strong>{report.confidence}%</strong></div>
                <Progress value={report.confidence} className="mt-3" />
                <p className="mt-4 text-xs font-bold text-muted-foreground">{report.humanConfirmationNotice}</p>
              </div>
            </div>
          </Card>

          <HelpCard title="Evidence considered" tone="cyan">
            AI considered approved, rejected, disputed, and late tasks; attached proof; member contribution signals; delay analysis; and recorded disputes. It recommends only. Your team confirms the final outcome manually.
          </HelpCard>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Planned tasks" value={report.taskStatistics.total} icon={<FileCheck2 size={20} />} />
            <MetricCard label="Approved" value={report.taskStatistics.approved} icon={<CheckCircle2 size={20} />} />
            <MetricCard label="Disputed" value={report.taskStatistics.disputed} icon={<TriangleAlert size={20} />} />
            <MetricCard label="Overdue" value={report.taskStatistics.overdue} icon={<Gauge size={20} />} />
          </div>

          <Card>
            <SectionHeader title="Success criteria evaluation" description="Each criterion is evaluated against evidence and review outcomes." />
            <div className="grid gap-3">
              {report.successCriteriaEvaluation.map((item) => (
                <div key={item.criterion} className="rounded-xl border border-border bg-secondary p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <strong>{item.criterion}</strong>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reasoning}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeader title="Member contribution scores" />
              <div className="space-y-4">
                {report.memberContributions.map((member) => {
                  const pledge = pledges?.find((item) => item.user_id === member.userId);
                  const name = (pledge?.profiles as unknown as { name: string } | undefined)?.name || member.userId;
                  return (
                    <div key={member.userId}>
                      <div className="mb-1 flex justify-between text-sm"><strong>{name}</strong><span className="text-muted-foreground">{member.contributionScore}/100</span></div>
                      <Progress value={member.contributionScore} />
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{member.reasoning}</p>
                      {member.strengthsObserved.length ? <p className="mt-2 text-xs font-bold text-cyan-100">Strengths observed: {member.strengthsObserved.join(", ")}</p> : null}
                      {member.issues.length ? <p className="mt-1 text-xs font-bold text-amber-100">Open issues: {member.issues.join(", ")}</p> : null}
                      <p className="mt-2 rounded-xl border border-amber-300/20 bg-amber-400/10 p-2 text-xs font-bold text-amber-100">
                        AI pledge recommendation: {member.pledgeRecommendation.recommendedReturnPercentage}% - {member.pledgeRecommendation.reasoning}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <SectionHeader title="Delay and dispute analysis" />
              <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p><strong className="text-foreground">Evidence quality:</strong> {report.evidenceQualityAnalysis}</p>
                <p><strong className="text-foreground">Delay analysis:</strong> {report.delayAnalysis}</p>
                <p><strong className="text-foreground">Dispute summary:</strong> {report.disputeSummary}</p>
              </div>
            </Card>
          </div>

          {decision ? (
            <Card className="border-emerald-400/30 bg-emerald-400/10">
              <div className="flex gap-3"><CheckCircle2 className="text-emerald-300" /><div><h2 className="font-black">Human decision confirmed</h2><p className="mt-1 text-sm text-muted-foreground">This manual action is the final recorded outcome. No funds were transferred.</p></div></div>
              <div className="mt-4 space-y-2">{Object.entries(finalActions ?? {}).map(([userId, action]) => <div key={userId} className="flex justify-between rounded-xl border border-border bg-card p-3"><strong>{action.name}</strong><span>Return {action.return_percentage}% pledge</span></div>)}</div>
            </Card>
          ) : (
            <Card className="border-amber-300/30 bg-amber-400/10">
              <div className="flex gap-3">
                <ShieldCheck className="text-amber-300" />
                <div>
                  <h2 className="text-lg font-black">Human confirmation required</h2>
                  <p className="text-sm leading-6 text-muted-foreground">Review the AI recommendation together, then confirm the final outcome manually. CommitBet does not collect or transfer money.</p>
                </div>
              </div>
              <form action={confirmFinalDecision} className="mt-5 grid gap-4">
                <input type="hidden" name="project_id" value={id} />
                {pledges?.map((pledge) => {
                  const recommendation = report.memberContributions.find((item) => item.userId === pledge.user_id)?.pledgeRecommendation;
                  return (
                    <label key={pledge.user_id}>
                      {(pledge.profiles as unknown as { name: string }).name}: virtual pledge return percentage
                      <input name={`return_${pledge.user_id}`} type="number" min={0} max={100} defaultValue={recommendation?.recommendedReturnPercentage ?? 0} required />
                      <small className="font-normal text-muted-foreground">AI suggested {recommendation?.recommendedReturnPercentage ?? 0}%: {recommendation?.reasoning}</small>
                    </label>
                  );
                })}
                <label className="flex grid-cols-none items-start gap-3 rounded-xl border border-amber-300/30 bg-background/45 p-4">
                  <input className="mt-1 size-5 w-auto" type="checkbox" name="human_confirmation" value="yes" required />
                  <span>I understand this is my team’s manual virtual-pledge decision. No funds are transferred.</span>
                </label>
                <Button type="submit" size="lg"><Users size={18} /> Confirm final outcome</Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
