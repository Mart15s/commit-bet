import { ArrowRight, Scale, ShieldAlert } from "lucide-react";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { AppShell } from "@/components/commitbet/app-shell";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { HumanConfirmationBanner } from "@/components/commitbet/human-confirmation-banner";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { PageIntro, SectionTitle, StatBlock } from "@/components/commitbet/screen-elements";
import { StatusChip } from "@/components/commitbet/status-chip";

export default function DisputeDemoPage() {
  return (
    <AppShell>
      <PageIntro title="Resolve dispute" description="AI recommendation - Human decision required" trailing={<StatusChip status="human_required" />} />
      <div className="grid gap-5 lg:grid-cols-[.86fr_1.14fr]">
        <PremiumCard variant="warning">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-amber-300">
            <Scale size={15} /> Dispute summary
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.045em]">Publish landing page</h2>
          <div className="mt-5 grid gap-3">
            <StatBlock label="Performer" value="Jon" />
            <StatBlock label="Reviewer" value="Maya" />
          </div>
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Issue</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Reviewer says the landing page is live, but form validation is incomplete.</p>
          </div>
        </PremiumCard>

        <div className="space-y-5">
          <AIInsightCard
            label="AI mediator panel"
            recommendation="Needs changes"
            confidence={78}
            reasoning="The evidence proves deployment, but does not prove the required validation states."
            suggestedAction="Give 24 hours to submit validation proof."
            dataUsed="live URL, review comment, success criteria"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <PremiumCard variant="success">
              <SectionTitle title="Supports approval" />
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Live URL exists</li>
                <li>Layout matches scope</li>
              </ul>
            </PremiumCard>
            <PremiumCard variant="danger">
              <SectionTitle title="Supports rejection" />
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Validation states are missing</li>
                <li>Error states are not documented</li>
              </ul>
            </PremiumCard>
          </div>
          <HumanConfirmationBanner />
          <PremiumCard className="grid gap-3 sm:grid-cols-3">
            <GradientButton fullWidth><ArrowRight size={17} />Accept AI recommendation</GradientButton>
            <GradientButton variant="secondary" fullWidth>Override decision</GradientButton>
            <GradientButton variant="secondary" fullWidth><ShieldAlert size={17} />Request more evidence</GradientButton>
          </PremiumCard>
        </div>
      </div>
    </AppShell>
  );
}
