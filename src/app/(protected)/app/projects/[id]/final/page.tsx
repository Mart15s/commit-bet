import { T } from "@/components/language-provider";
import { AIRecommendation } from "@/components/ai-recommendation";
import {
  Brain,
  CheckCircle2,
  FileCheck2,
  Gauge,
  Scale,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  confirmFinalDecision,
  generateFinal,
} from "@/app/(protected)/app/projects/[id]/final/actions";
import {
  Button,
  ButtonLink,
  Card,
  ErrorMessage,
  MetricCard,
  PageHeader,
  Progress,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
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
  const [{ data: reportRows }, { data: pledges }, { data: decision }] =
    await Promise.all([
      supabase
        .from("ai_reports")
        .select("output, model, created_at")
        .eq("project_id", id)
        .eq("type", "final")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase.from("pledges").select("*, profiles(name)").eq("project_id", id),
      supabase
        .from("final_decisions")
        .select("*")
        .eq("project_id", id)
        .maybeSingle(),
    ]);
  const report = reportRows?.[0]?.output as
    | {
        project_summary: string;
        success_criteria_evaluation: Array<{
          criterion: string;
          status: string;
          comment: string;
        }>;
        task_statistics: {
          planned: number;
          approved: number;
          rejected: number;
          disputed: number;
          late: number;
        };
        member_contributions: Array<{
          user_id: string;
          contribution_score: number;
          summary: string;
          strongest_evidence: string[];
          issues: string[];
        }>;
        evidence_quality_score: number;
        delay_analysis: string;
        dispute_summary: string;
        pledge_recommendation: Array<{
          user_id: string;
          pledge_return_percentage: number;
          reason: string;
        }>;
        reasoning: string;
        confidence_score: number;
      }
    | undefined;
  const finalActions = decision?.final_action as
    | Record<string, { name: string; return_percentage: number }>
    | undefined;
  const metCount =
    report?.success_criteria_evaluation.filter((item) => item.status === "met")
      .length ?? 0;
  const totalCriteria = report?.success_criteria_evaluation.length ?? 0;
  const outcome = !report
    ? "Needs manual review"
    : report.task_statistics.planned === 0
      ? "Needs manual review"
      : report.task_statistics.approved === 0
        ? "Not completed"
        : report.task_statistics.disputed > 0 || report.confidence_score < 60
          ? "Needs manual review"
          : totalCriteria && metCount === totalCriteria
            ? "Success"
            : "Partial success";

  return (
    <>
      <ButtonLink
        href={`/app/projects/${id}`}
        variant="ghost"
        size="sm"
        className="mb-3"
      >
        <T id="Back to project" />
      </ButtonLink>
      <PageHeader
        eyebrowKey="AI final report"
        titleKey="Final project report"
        description={project.title}
        action={
          decision ? (
            <StatusBadge status="completed" />
          ) : (
            <StatusBadge status="human confirmation required" />
          )
        }
      />
      <ErrorMessage message={query.error} />

      {!report && (
        <Card className="mt-5 border-ai/25 bg-ai/10 text-center">
          <Scale className="mx-auto text-ai" size={42} />
          <h2 className="mt-4 text-2xl font-bold tracking-[-.03em]">
            <T id="No final report yet" />
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            <T id="The report appears after you generate an evidence audit. It evaluates success criteria, task statistics, member contribution, evidence quality, delay patterns, disputes, and virtual pledge recommendations." />
          </p>
          <p className="mx-auto mt-4 max-w-xl rounded-xl border border-ai/20 bg-background/45 p-3 text-sm font-bold text-ai">
            <T id="Human confirmation is still required after AI recommends an outcome." />
          </p>
          <form action={generateFinal} className="mt-6">
            <input type="hidden" name="project_id" value={id} />
            <Button type="submit" size="lg">
              <Brain size={18} /> <T id="Generate final report" />
            </Button>
          </form>
        </Card>
      )}

      {report && (
        <div className="mt-5 space-y-6">
          <Card className="border-ai/25 bg-ai/10">
            <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-ai">
                  <Brain size={16} /> <T id="AI recommendation" />
                </div>
                <h2 className="mt-3 text-3xl font-bold tracking-[-.035em]">
                  <T id={outcome} />
                </h2>
                <p className="mt-3 leading-7">{report.project_summary}</p>
                <p className="mt-4 rounded-xl border border-ai/20 bg-background/55 p-3 text-sm font-bold text-ai">
                  <span className="text-foreground">
                    <T id="Why AI thinks this:" />
                  </span>{" "}
                  {report.reasoning}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    <T id="Confidence" />
                  </span>
                  <strong>
                    {typeof report.confidence_score === "number"
                      ? `${report.confidence_score}%`
                      : "—"}
                  </strong>
                </div>
                {typeof report.confidence_score === "number" && (
                  <Progress value={report.confidence_score} className="mt-3" />
                )}
                <p className="mt-4 text-xs font-bold text-muted-foreground">
                  <T id="Human confirmation is required before the sprint outcome is recorded." />
                </p>
              </div>
            </div>
          </Card>

          <AIRecommendation
            confidence={report.confidence_score}
            mock={reportRows?.[0]?.model?.startsWith("mock")}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Planned tasks"
              value={report.task_statistics.planned}
              icon={<FileCheck2 size={20} />}
            />
            <MetricCard
              label="Approved"
              value={report.task_statistics.approved}
              icon={<CheckCircle2 size={20} />}
            />
            <MetricCard
              label="Disputed"
              value={report.task_statistics.disputed}
              icon={<TriangleAlert size={20} />}
            />
            <MetricCard
              label="Evidence quality"
              value={`${report.evidence_quality_score}/100`}
              icon={<Gauge size={20} />}
            />
          </div>

          <Card>
            <SectionHeader
              title="Success criteria evaluation"
              description="Each criterion is evaluated against evidence and review outcomes."
            />
            <div className="grid gap-3">
              {report.success_criteria_evaluation.map((item) => (
                <div
                  key={item.criterion}
                  className="rounded-xl border border-border bg-secondary p-4"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <strong>{item.criterion}</strong>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.comment}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeader title="Member contribution scores" />
              <div className="space-y-4">
                {report.member_contributions.map((member) => {
                  const pledge = pledges?.find(
                    (item) => item.user_id === member.user_id,
                  );
                  const name =
                    (
                      pledge?.profiles as unknown as
                        | { name: string }
                        | undefined
                    )?.name || member.user_id;
                  return (
                    <div key={member.user_id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <strong>{name}</strong>
                        <span className="text-muted-foreground">
                          {member.contribution_score}/100
                        </span>
                      </div>
                      <Progress value={member.contribution_score} />
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {member.summary}
                      </p>
                      {member.strongest_evidence.length ? (
                        <p className="mt-2 text-xs font-bold text-ai">
                          <T id="Strongest evidence:" />{" "}
                          {member.strongest_evidence.join(", ")}
                        </p>
                      ) : null}
                      {member.issues.length ? (
                        <p className="mt-1 text-xs font-bold text-warning">
                          <T id="Open issues:" /> {member.issues.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <SectionHeader title="Delay and dispute analysis" />
              <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  <strong className="text-foreground">
                    <T id="Delay analysis:" />
                  </strong>{" "}
                  {report.delay_analysis}
                </p>
                <p>
                  <strong className="text-foreground">
                    <T id="Dispute summary:" />
                  </strong>{" "}
                  {report.dispute_summary}
                </p>
              </div>
            </Card>
          </div>

          {decision ? (
            <Card className="border-success/30 bg-success/10">
              <div className="flex gap-3">
                <CheckCircle2 className="text-success" />
                <div>
                  <h2 className="font-bold">
                    <T id="Human decision confirmed" />
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <T id="This manual action is the final recorded outcome. No funds were transferred." />
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {Object.entries(finalActions ?? {}).map(([userId, action]) => (
                  <div
                    key={userId}
                    className="flex justify-between rounded-xl border border-border bg-card p-3"
                  >
                    <strong>{action.name}</strong>
                    <span>
                      <T id="Return" /> {action.return_percentage}
                      <T id="% pledge" />
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="border-warning/30 bg-warning/10">
              <div className="flex gap-3">
                <ShieldCheck className="text-warning" />
                <div>
                  <h2 className="text-lg font-bold">
                    <T id="Human confirmation required" />
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    <T id="Review the AI recommendation together, then confirm the final outcome manually. CommitBet does not collect or transfer money." />
                  </p>
                </div>
              </div>
              <form action={confirmFinalDecision} className="mt-5 grid gap-4">
                <input type="hidden" name="project_id" value={id} />
                {pledges?.map((pledge) => {
                  const recommendation = report.pledge_recommendation.find(
                    (item) => item.user_id === pledge.user_id,
                  );
                  return (
                    <label key={pledge.user_id}>
                      {(pledge.profiles as unknown as { name: string }).name}
                      <T id=": virtual pledge return percentage" />
                      <input
                        name={`return_${pledge.user_id}`}
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={
                          recommendation?.pledge_return_percentage ?? ""
                        }
                        required
                      />
                      <small className="font-normal text-muted-foreground">
                        <T id="AI suggested" />{" "}
                        {recommendation?.pledge_return_percentage ?? "—"}%:{" "}
                        {recommendation?.reason}
                      </small>
                    </label>
                  );
                })}
                <label className="flex grid-cols-none items-start gap-3 rounded-xl border border-warning/30 bg-background/45 p-4">
                  <input
                    className="mt-1 size-5 w-auto"
                    type="checkbox"
                    name="human_confirmation"
                    value="yes"
                    required
                  />
                  <span>
                    <T id="I understand this is my team’s manual virtual-pledge decision. No funds are transferred." />
                  </span>
                </label>
                <Button type="submit" size="lg">
                  <Users size={18} /> <T id="Confirm final outcome" />
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
