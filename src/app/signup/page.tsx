import { ArrowRight, Building2, FileCheck2, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/commitbet/app-shell";
import { BrandLogo } from "@/components/commitbet/brand-logo";
import { FormField } from "@/components/commitbet/form-controls";
import { GradientButton } from "@/components/commitbet/gradient-button";
import { PremiumCard } from "@/components/commitbet/premium-card";

const flow = ["Workspace", "Team", "Sprint", "Evidence", "Final report"];

export default function SignupPage() {
  return (
    <AppShell topBar={false}>
      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-5xl items-center gap-8 md:grid-cols-[.9fr_1.1fr]">
        <section>
          <BrandLogo />
          <h1 className="mt-8 text-4xl font-black tracking-[-0.06em] sm:text-5xl">Create your workspace</h1>
          <p className="mt-3 max-w-md text-slate-400">Start a commitment sprint in minutes.</p>
          <PremiumCard variant="success" className="mt-7">
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 shrink-0 text-emerald-300" />
              <div>
                <h2 className="font-extrabold">Built for accountability, not gambling.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Commitments are transparent, evidence-based, and confirmed by people.</p>
              </div>
            </div>
          </PremiumCard>
        </section>

        <PremiumCard variant="hero" glow className="p-5 sm:p-7">
          <form className="grid gap-4" aria-label="Create workspace">
            <FormField label="Work email" name="email" type="email" autoComplete="email" placeholder="maya@studio.com" required />
            <FormField label="Password" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required />
            <FormField label="Workspace name" name="workspace" placeholder="Investor MVP team" required />
            <GradientButton type="submit" fullWidth>Create account <ArrowRight size={17} /></GradientButton>
          </form>
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-300">
              <Building2 size={15} /> Mini flow
            </div>
            <div className="grid gap-2">
              {flow.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] p-3">
                  <span className="grid size-8 place-items-center rounded-full bg-blue-500/12 text-xs font-black text-blue-300">{index + 1}</span>
                  <span className="flex-1 text-sm font-bold">{item}</span>
                  {index === 1 ? <UsersRound size={16} className="text-cyan-300" /> : <FileCheck2 size={16} className="text-slate-500" />}
                </div>
              ))}
            </div>
          </div>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
