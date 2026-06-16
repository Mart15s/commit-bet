import { ArrowRight, CalendarDays, Sparkles, UsersRound } from "lucide-react";
import { AppShell } from "@/components/commitbet/app-shell";
import { FormField, FormSection, SegmentedControl, TextAreaField } from "@/components/commitbet/form-controls";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { MemberAvatarStack } from "@/components/commitbet/member-avatar-stack";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { ProgressBar } from "@/components/commitbet/progress-bar";
import { PageIntro } from "@/components/commitbet/screen-elements";
import { demoMembers } from "@/lib/demo-data";

export default function NewSprintPage() {
  return (
    <AppShell>
      <PageIntro eyebrow="Step 1 of 8 - Project basics" title="Create a commitment sprint" description="Define the agreement first. AI turns it into daily accountable work." />
      <ProgressBar value={12} variant="ai" label="Sprint setup progress" className="mb-6" />

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="grid gap-4">
          <FormSection title="Project basics">
            <FormField label="Project name" name="project" defaultValue="Launch the investor-ready MVP" />
            <TextAreaField label="One-sentence goal" name="goal" defaultValue="Ship a credible product demo and final report." />
          </FormSection>
          <FormSection title="Success criteria" description="Use artifacts reviewers can actually inspect.">
            <TextAreaField label="Success criteria" name="criteria" defaultValue="Live MVP - Demo video - 5 user tests" />
          </FormSection>
          <FormSection title="Duration">
            <SegmentedControl items={["7 days", "14 days", "30 days", "Custom"]} selected="14 days" />
          </FormSection>
          <FormSection title="Team" description="Availability helps the AI balance workload.">
            <div className="grid gap-3">
              {demoMembers.map((member) => (
                <article key={member.name} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5">
                  <MemberAvatarStack members={[member]} size="sm" />
                  <div className="flex-1">
                    <h3 className="text-sm font-extrabold">{member.shortName}</h3>
                    <p className="text-xs text-slate-500">{member.role} - {member.availability}</p>
                  </div>
                </article>
              ))}
            </div>
          </FormSection>
          <FormSection title="Commitment">
            <FormField label="Pledge / commitment amount" name="pledge" defaultValue="$50 per member" hint="Alternative: 50 commitment points per member." />
          </FormSection>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PremiumCard variant="hero" glow>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">Live sprint preview</p>
              <Sparkles className="text-purple-300" size={18} />
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3"><span className="text-slate-400">Duration</span><strong>14 days</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3"><span className="flex items-center gap-2 text-slate-400"><UsersRound size={15} />Team</span><strong>3 members</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3"><span className="text-slate-400">Commitment</span><strong>$50/member</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3"><span className="flex items-center gap-2 text-slate-400"><CalendarDays size={15} />Evidence</span><strong>Daily</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-blue-500/10 p-3 text-blue-200"><span>AI plan</span><strong>Ready to generate</strong></div>
            </div>
            <GradientButton href="/sprints/demo/ai-plan" className="mt-5" fullWidth>Generate AI plan <ArrowRight size={17} /></GradientButton>
          </PremiumCard>
        </aside>
      </div>
    </AppShell>
  );
}
