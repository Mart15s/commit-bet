import { ArrowRight, Sparkles } from "lucide-react";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { AppShell } from "@/components/commitbet/app-shell";
import { EvidenceUploadCard } from "@/components/commitbet/evidence-upload-card";
import { FormField, FormSection, TextAreaField } from "@/components/commitbet/form-controls";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { PageIntro } from "@/components/commitbet/screen-elements";
import { StatusChip } from "@/components/commitbet/status-chip";

export default function SubmitProofPage() {
  return (
    <AppShell bottomNav>
      <PageIntro title="Submit today's proof" description="Fast, clear, and reviewable." />
      <div className="grid gap-5 lg:grid-cols-[1fr_23rem]">
        <div className="grid gap-4">
          <FormSection title="Daily update">
            <TextAreaField label="What did you complete today?" name="completed" defaultValue="Completed onboarding flow and workspace states." />
            <FormField label="Related task" name="task" defaultValue="Complete onboarding prototype" />
            <FormField label="Time spent" name="time" defaultValue="2h 15m" />
          </FormSection>
          <EvidenceUploadCard />
          <FormSection title="Context for reviewers">
            <TextAreaField label="Blockers" name="blockers" defaultValue="Waiting on final copy review." />
            <TextAreaField label="Tomorrow's next step" name="tomorrow" defaultValue="Record walkthrough and resolve notes." />
          </FormSection>
          <GradientButton fullWidth>Submit today&apos;s proof <ArrowRight size={17} /></GradientButton>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PremiumCard variant="ai">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-purple-300">
              <Sparkles size={15} /> AI note
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">AI will check alignment with acceptance criteria before notifying your reviewer.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusChip status="ai_review" />
              <StatusChip status="human_required" />
            </div>
          </PremiumCard>
          <AIInsightCard
            recommendation="Proof quality looks strong."
            confidence={86}
            reasoning="The update references a concrete task, time spent, blockers, and a next step. Attach a prototype link for the strongest review path."
            suggestedAction="Add Figma or screenshot evidence before submitting."
          />
        </aside>
      </div>
    </AppShell>
  );
}
