import type { LucideIcon, LucideProps } from "lucide-react";
import { ChevronRight, FileCheck2 } from "lucide-react";
import type { ReactNode } from "react";
import { StatusChip, type CommitBetStatus } from "./status-chip";

export function PageIntro({
  eyebrow,
  title,
  description,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-300">{eyebrow}</p>}
        <h1 className="text-balance text-3xl font-black leading-[1.05] tracking-[-0.05em] sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>}
      </div>
      {trailing}
    </header>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-extrabold tracking-[-0.025em] sm:text-xl">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function IconLabel({
  icon: Icon,
  children,
  tone = "blue",
}: {
  icon: LucideIcon;
  children: ReactNode;
  tone?: "blue" | "cyan" | "green" | "amber" | "purple";
}) {
  const tones = {
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    purple: "border-purple-400/20 bg-purple-400/10 text-purple-300",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${tones[tone]}`}><Icon size={12} />{children}</span>;
}

export function TaskRow({
  title,
  status,
  proof,
  due,
}: {
  title: string;
  status: CommitBetStatus;
  proof: string;
  due: string;
}) {
  return (
    <article className="group flex items-center gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.035] p-3.5 hover:border-white/[0.14] hover:bg-white/[0.055]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-black/20 text-blue-300"><FileCheck2 size={18} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-extrabold text-slate-100">{title}</h3>
          <StatusChip status={status} />
        </div>
        <p className="mt-1 text-xs text-slate-500">Proof: {proof} · {due}</p>
      </div>
      <ChevronRight size={17} className="shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
    </article>
  );
}

export function StatBlock({ label, value, icon: Icon }: { label: string; value: string; icon?: (props: LucideProps) => ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{label}</p>
        {Icon && <span className="text-blue-300">{Icon({ size: 15 })}</span>}
      </div>
      <p className="mt-2 text-xl font-black tracking-[-0.035em]">{value}</p>
    </div>
  );
}
