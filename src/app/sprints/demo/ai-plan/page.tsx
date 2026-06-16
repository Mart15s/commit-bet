import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { AppShell } from "@/components/commitbet/app-shell";
import { ContributionBars } from "@/components/commitbet/contribution-bars";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { ProgressBar } from "@/components/commitbet/progress-bar";
import { PageIntro, SectionTitle } from "@/components/commitbet/screen-elements";
import { TimelineItem, TimelineRoot } from "@/components/commitbet/timeline";
import { demoMembers, demoTimeline } from "@/lib/demo-data";

export default function AIPlanPage() {
  return (
    <AppShell>
      <PageIntro eyebrow="14 days - 4 phases - 88% confidence" title="AI-generated plan" description="Plan optimized for team availability, success criteria, and evidence quality." />
      <div className="grid gap-5 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-5">
          <AIInsightCard
            label="AI guidance"
            recommendation="Balanced workload with 2 known risks"
            confidence={88}
            reasoning="The plan spreads design and engineering load across the highest-risk days while keeping each expected proof artifact reviewable."
            suggestedAction="Accept the plan, then ask for extra proof on integration days."
            dataUsed="availability, success criteria, proof history"
          />
          <PremiumCard>
            <SectionTitle title="Execution timeline" description="Each phase has an owner, expected proof, and risk level." />
            <TimelineRoot>
              {demoTimeline.map((item, index) => (
                <TimelineItem
                  key={item.title}
                  dateRange={item.dateRange}
                  owner={item.owner}
                  title={item.title}
                  expectedProof={item.expectedProof}
                  risk={item.risk}
                  status={item.status}
                  isLast={index === demoTimeline.length - 1}
                />
              ))}
            </TimelineRoot>
          </PremiumCard>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <PremiumCard variant="hero">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-300">
              <BarChart3 size={15} /> Workload balance
            </div>
            <div className="mt-5">
              <ContributionBars members={demoMembers.map((member) => ({ name: `${member.shortName} ${member.availability}`, score: member.shortName === "Jon" ? 92 : member.shortName === "Maya" ? 76 : 58 }))} />
            </div>
          </PremiumCard>
          <PremiumCard variant="ai">
            <Sparkles className="text-purple-300" />
            <h2 className="mt-4 text-xl font-black">Confidence meter</h2>
            <ProgressBar className="mt-4" value={88} variant="ai" label="AI confidence" />
            <p className="mt-3 text-sm leading-6 text-slate-400">Confidence reflects plan fit, not an automatic outcome decision.</p>
          </PremiumCard>
          <div className="grid gap-3">
            <GradientButton href="/sprints/demo" fullWidth>Accept plan <ArrowRight size={17} /></GradientButton>
            <GradientButton href="/sprints/new" variant="secondary" fullWidth>Edit or regenerate</GradientButton>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
