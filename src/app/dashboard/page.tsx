import { Clock3, FileCheck2, ShieldAlert, Sparkles } from "lucide-react";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { AppShell } from "@/components/commitbet/app-shell";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { MetricCard } from "@/components/commitbet/metric-card";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { ProgressBar } from "@/components/commitbet/progress-bar";
import { ScoreRing } from "@/components/commitbet/score-ring";
import { PageIntro, SectionTitle, TaskRow } from "@/components/commitbet/screen-elements";
import { StatusChip } from "@/components/commitbet/status-chip";
import { demoTasks } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell bottomNav>
      <PageIntro title="Good morning, Maya." description="Your team is 72% on track." />

      <PremiumCard variant="hero" glow className="mb-6">
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <ScoreRing score={72} label="On track" size={132} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-300">Today&apos;s commitment</p>
              <StatusChip status="ai_review" label="AI found 2 risks" />
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.055em]">Proof due in 6h 18m</h2>
            <ProgressBar className="mt-4" value={50} variant="ai" label="2 of 4 tasks completed" />
            <GradientButton href="/sprints/demo/proof/new" className="mt-5" fullWidth>Log today&apos;s proof</GradientButton>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <section>
          <SectionTitle title="Today's tasks" description="Every task has an expected proof type." />
          <div className="grid gap-3">
            {demoTasks.map((task) => <TaskRow key={task.title} title={task.title} status={task.status} proof={task.proof} due={task.due} />)}
          </div>
        </section>
        <div className="space-y-4">
          <MetricCard label="Pending approvals" value="2" subtext="Oldest review has waited 3 hours." icon={ShieldAlert} progress={64} />
          <AIInsightCard
            recommendation="One proof artifact is too vague."
            confidence={82}
            reasoning="The onboarding copy was submitted, but the linked document does not show final mobile state coverage."
            suggestedAction="Ask Maya to attach the prototype screen before approval."
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Evidence quality" value="78%" icon={FileCheck2} />
        <MetricCard label="Sprint pace" value="On track" icon={Clock3} />
        <MetricCard label="AI review" value="2 risks" icon={Sparkles} />
      </div>
    </AppShell>
  );
}
