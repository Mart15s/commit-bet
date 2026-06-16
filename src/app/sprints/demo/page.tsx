import { AlertTriangle, Clock3, FileCheck2, ShieldCheck } from "lucide-react";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { AppShell } from "@/components/commitbet/app-shell";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { MetricCard } from "@/components/commitbet/metric-card";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { ProgressBar } from "@/components/commitbet/progress-bar";
import { ScoreRing } from "@/components/commitbet/score-ring";
import { PageIntro, SectionTitle, TaskRow } from "@/components/commitbet/screen-elements";

const goals = [
  { title: "Finish onboarding prototype", status: "in_progress", proof: "Figma", due: "Today" },
  { title: "Approve pricing evidence", status: "submitted", proof: "Docs", due: "Today" },
  { title: "Record walkthrough", status: "todo", proof: "Demo video", due: "6 PM" },
] as const;

export default function SprintOverviewPage() {
  return (
    <AppShell bottomNav>
      <PageIntro
        title="Launch the investor-ready MVP"
        description="9 days remaining - Commitment active"
        trailing={<GradientButton href="/sprints/demo/proof/new" className="hidden sm:inline-flex">Log proof</GradientButton>}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-5">
          <PremiumCard variant="hero" glow>
            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <ScoreRing score={82} label="Success" />
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-300">Project Success Score</p>
                <h2 className="mt-2 text-4xl font-black tracking-[-0.06em]">82</h2>
                <ProgressBar className="mt-4" value={72} variant="ai" label="72% on track" />
              </div>
            </div>
          </PremiumCard>
          <AIInsightCard
            recommendation="One critical task is missing evidence."
            confidence={81}
            reasoning="The task is marked in progress, but no walkthrough, link, or reviewable artifact has been submitted."
            suggestedAction="Request demo proof by 6 PM."
          />
          <section>
            <SectionTitle title="Today's goals" />
            <div className="grid gap-3">
              {goals.map((goal) => <TaskRow key={goal.title} title={goal.title} status={goal.status} proof={goal.proof} due={goal.due} />)}
            </div>
          </section>
        </div>
        <aside className="space-y-4">
          <MetricCard label="Evidence quality" value="78%" subtext="Proof is strong, but one artifact is missing." icon={FileCheck2} progress={78} />
          <MetricCard label="Missing proof" value="1" subtext="Record walkthrough needs evidence." icon={AlertTriangle} />
          <MetricCard label="Pending review" value="2" subtext="Oldest review has waited 3 hours." icon={Clock3} />
          <PremiumCard variant="success">
            <div className="flex gap-3">
              <ShieldCheck className="text-emerald-300" />
              <p className="text-sm leading-6 text-slate-300">AI recommendations are advisory. Final project outcomes require human confirmation.</p>
            </div>
          </PremiumCard>
        </aside>
      </div>
    </AppShell>
  );
}
