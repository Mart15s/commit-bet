import { Check, MessageSquareText, ShieldAlert } from "lucide-react";
import { AcceptanceCriteriaList } from "@/components/commitbet/acceptance-criteria-list";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { AppShell } from "@/components/commitbet/app-shell";
import { EvidencePreviewCard } from "@/components/commitbet/evidence-preview-card";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { HumanConfirmationBanner } from "@/components/commitbet/human-confirmation-banner";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { PageIntro, SectionTitle } from "@/components/commitbet/screen-elements";
import { acceptanceCriteria } from "@/lib/demo-data";

export default function ReviewDemoPage() {
  return (
    <AppShell bottomNav>
      <PageIntro title="Review submitted work" description="Complete onboarding prototype - Maya" />
      <div className="grid gap-5 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-5">
          <EvidencePreviewCard
            source="Figma prototype"
            title="Create your workspace"
            metadata="Verified source - 12 frames - Mobile and desktop"
            description="Workspace creation flow, workspace name field, continue button, and core responsive states."
            visual
          />
          <PremiumCard>
            <SectionTitle title="Acceptance criteria" />
            <AcceptanceCriteriaList criteria={acceptanceCriteria} />
          </PremiumCard>
          <PremiumCard>
            <label htmlFor="comment" className="grid gap-2 text-sm font-bold text-slate-300">
              Reviewer comment
              <textarea id="comment" name="comment" placeholder="Explain the decision with specific evidence." />
            </label>
          </PremiumCard>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <AIInsightCard
            recommendation="AI thinks 2 of 3 criteria are met."
            confidence={84}
            reasoning="The submitted prototype proves the main flow and responsive states. Error-state coverage is not explicit."
            suggestedAction="Approve if error states are not blocking, or request a small follow-up artifact."
          />
          <HumanConfirmationBanner description="Your review is the decision. AI only summarizes evidence alignment." />
          <PremiumCard variant="hero" className="grid gap-3">
            <GradientButton fullWidth><Check size={17} />Approve</GradientButton>
            <GradientButton variant="secondary" fullWidth><MessageSquareText size={17} />Needs changes</GradientButton>
            <GradientButton variant="destructive" fullWidth><ShieldAlert size={17} />Reject or open dispute</GradientButton>
          </PremiumCard>
        </aside>
      </div>
    </AppShell>
  );
}
