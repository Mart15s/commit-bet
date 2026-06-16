import { CheckCircle2, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { AppShell } from "@/components/commitbet/app-shell";
import { ContributionBars } from "@/components/commitbet/contribution-bars";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { HumanConfirmationBanner } from "@/components/commitbet/human-confirmation-banner";
import { MetricCard } from "@/components/commitbet/metric-card";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { ScoreRing } from "@/components/commitbet/score-ring";
import { PageIntro, SectionTitle } from "@/components/commitbet/screen-elements";
import { StatusChip } from "@/components/commitbet/status-chip";
import { demoMembers } from "@/lib/demo-data";

export default function FinalReportDemoPage() {
  return (
    <AppShell>
      <PageIntro title="Final AI report" description="Launch the investor-ready MVP - Completed" trailing={<StatusChip status="approved" label="Completed" />} />
      <PremiumCard variant="success" glow className="mb-5">
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr_auto]">
          <ScoreRing score={88} variant="green" label="Outcome" size={160} />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">Outcome achieved</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.06em]">Project Success Score</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Core criteria were met with credible evidence, one dispute resolved, and human confirmation still required for the final decision.</p>
          </div>
          <CheckCircle2 className="hidden text-emerald-300 sm:block" size={48} />
        </div>
      </PremiumCard>

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Tasks completed" value="23 / 25" icon={CheckCircle2} />
            <MetricCard label="Evidence quality" value="91%" icon={FileCheck2} />
            <MetricCard label="AI confidence" value="86%" icon={Sparkles} />
            <MetricCard label="Resolved disputes" value="1" icon={ShieldCheck} />
          </div>
          <PremiumCard>
            <SectionTitle title="Contribution breakdown" />
            <ContributionBars members={demoMembers} />
          </PremiumCard>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <AIInsightCard
            label="AI recommendation"
            recommendation="Return all member pledges"
            confidence={86}
            reasoning="Core criteria were met with credible evidence."
            suggestedAction="Review contribution scores and confirm the final decision."
          />
          <HumanConfirmationBanner />
          <div className="grid gap-3">
            <GradientButton fullWidth>Confirm final decision</GradientButton>
            <GradientButton variant="secondary" fullWidth>Adjust decision</GradientButton>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
