import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { PremiumCard } from "./premium-card";
import { ProgressBar } from "./progress-bar";

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  subtext?: string;
  trend?: string;
  icon?: LucideIcon;
  progress?: number;
}) {
  return (
    <PremiumCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-[-0.045em]">{value}</p>
        </div>
        {Icon && <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-blue-300"><Icon size={18} /></span>}
      </div>
      {subtext && <p className="mt-2 text-xs leading-5 text-slate-500">{subtext}</p>}
      {trend && <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-300"><ArrowUpRight size={13} />{trend}</p>}
      {typeof progress === "number" && <ProgressBar className="mt-4" value={progress} variant="success" />}
    </PremiumCard>
  );
}
