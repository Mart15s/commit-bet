import { ArrowRight, FileCheck2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/commitbet/app-shell";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { HumanConfirmationBanner } from "@/components/commitbet/human-confirmation-banner";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { PageIntro } from "@/components/commitbet/screen-elements";

export default function EmptyDashboardPage() {
  return (
    <AppShell bottomNav>
      <div className="mx-auto max-w-3xl">
        <PageIntro
          title="Start your first commitment sprint"
          description="Create a project, invite your team, and let AI turn the goal into daily accountable work."
        />
        <PremiumCard variant="hero" glow className="relative min-h-[24rem]">
          <div className="absolute inset-6 rounded-[2rem] border border-dashed border-blue-300/18 bg-blue-500/[0.035]" />
          <div className="relative z-10 grid min-h-[20rem] place-items-center text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-3xl border border-blue-400/20 bg-blue-500/10 text-blue-300 shadow-[0_0_42px_rgba(47,123,255,.2)]">
                <Sparkles size={30} />
              </span>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.045em]">Mission control is ready</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Your first sprint will add score, proof, review, and final report modules here.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <GradientButton href="/sprints/new">Create sprint <ArrowRight size={17} /></GradientButton>
                <GradientButton href="/sprints/demo" variant="secondary">View demo sprint</GradientButton>
              </div>
            </div>
          </div>
        </PremiumCard>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <HumanConfirmationBanner />
          <PremiumCard className="flex items-center gap-3">
            <FileCheck2 className="text-cyan-300" />
            <p className="text-sm leading-6 text-slate-400">CommitBet turns vague project promises into evidence-based commitments.</p>
          </PremiumCard>
        </div>
      </div>
    </AppShell>
  );
}
