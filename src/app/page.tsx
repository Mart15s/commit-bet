import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { AIInsightCard } from "@/components/commitbet/ai-insight-card";
import { BrandLogo } from "@/components/commitbet/brand-logo";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { HumanConfirmationBanner } from "@/components/commitbet/human-confirmation-banner";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { ProgressBar } from "@/components/commitbet/progress-bar";
import { ScoreRing } from "@/components/commitbet/score-ring";
import { StatusChip } from "@/components/commitbet/status-chip";
import { flowSteps } from "@/lib/demo-data";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-16 size-[34rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandLogo />
        <Link href="/login" className="rounded-full border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/[0.09]">Sign in</Link>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.02fr_.98fr] md:pb-24 md:pt-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs font-extrabold text-blue-200">
            <Sparkles size={15} /> AI accountability for small teams
          </div>
          <h1 className="text-balance text-5xl font-black leading-[0.96] tracking-[-0.065em] sm:text-7xl">
            Stop abandoning projects after 2 days.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            CommitBet uses AI, proof, and commitment stakes to help your team finish what it starts.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <GradientButton href="/signup">Start a commitment sprint <ArrowRight size={18} /></GradientButton>
            <GradientButton href="/sprints/demo/final-report" variant="secondary">View demo report</GradientButton>
          </div>
          <p className="mt-4 text-sm text-slate-500">No real payments. Virtual pledges only. AI recommends, humans confirm.</p>
        </div>

        <PremiumCard variant="hero" glow className="mx-auto w-full max-w-xl p-4 sm:p-6">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">Project preview</p>
              <h2 className="mt-2 max-w-xs text-2xl font-black tracking-[-0.045em]">Launch the investor-ready MVP</h2>
            </div>
            <StatusChip status="commitment_active" label="Active" />
          </div>
          <div className="mt-7 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <ScoreRing score={82} label="Success" />
            <div>
              <p className="text-sm font-bold text-slate-400">Project Success Score</p>
              <p className="mt-2 text-4xl font-black tracking-[-0.06em]">82</p>
              <ProgressBar className="mt-4" value={72} variant="ai" label="72% on track" />
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                  <span className="flex items-center gap-2 text-sm text-slate-300"><Zap size={16} className="text-purple-300" />AI found 2 risks</span>
                  <span className="text-xs font-bold text-purple-300">Review</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                  <span className="flex items-center gap-2 text-sm text-slate-300"><Clock3 size={16} className="text-amber-300" />Proof due</span>
                  <span className="text-sm font-black text-white">6h 18m</span>
                </div>
              </div>
            </div>
          </div>
        </PremiumCard>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-3 md:grid-cols-5">
          {flowSteps.map(([number, title, copy], index) => (
            <article key={number} className="relative rounded-[1.35rem] border border-white/[0.08] bg-white/[0.035] p-5">
              <span className="text-sm font-black text-blue-300">{number}</span>
              <h2 className="mt-7 text-xl font-black tracking-[-0.035em]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              {index < flowSteps.length - 1 && <span className="absolute -right-2 top-1/2 hidden size-4 rounded-full border border-blue-300/20 bg-blue-300/20 md:block" />}
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-[.92fr_1.08fr]">
        <PremiumCard variant="ai">
          <AIInsightCard
            label="Why it works"
            recommendation="Evidence beats intention."
            confidence={88}
            reasoning="Teams finish more consistently when the next proof artifact is explicit, small, and reviewed by peers."
            suggestedAction="Start with one commitment sprint and one final report."
            dataUsed="tasks, proof quality, reviews, dispute state"
          />
        </PremiumCard>
        <PremiumCard variant="hero" glow className="grid content-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-extrabold text-emerald-300">
              <ShieldCheck size={14} /> Built for accountability, not gambling
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.06em]">Start finishing for $12 / member</h2>
            <p className="mt-3 max-w-xl text-slate-400">Unlimited sprints, evidence reviews, and reports.</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
            <HumanConfirmationBanner />
            <GradientButton href="/signup" className="self-end">Start a commitment sprint</GradientButton>
          </div>
        </PremiumCard>
      </section>
    </main>
  );
}
