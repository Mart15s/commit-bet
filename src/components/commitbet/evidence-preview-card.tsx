import { CheckCircle2, ExternalLink, LayoutTemplate } from "lucide-react";
import { PremiumCard } from "./premium-card";
import { StatusChip } from "./status-chip";

export function EvidencePreviewCard({
  source,
  title,
  metadata,
  description,
  visual = false,
}: {
  source: string;
  title: string;
  metadata: string;
  description: string;
  visual?: boolean;
}) {
  return (
    <PremiumCard className="p-4 sm:p-5">
      {visual && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d19] p-3">
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-3">
            <span className="size-2 rounded-full bg-rose-400/60" />
            <span className="size-2 rounded-full bg-amber-400/60" />
            <span className="size-2 rounded-full bg-emerald-400/60" />
          </div>
          <div className="mx-auto my-5 max-w-[13rem] rounded-xl border border-white/[0.08] bg-[#11192b] p-4 shadow-2xl">
            <div className="mb-4 flex items-center gap-2"><LayoutTemplate size={15} className="text-blue-300" /><span className="text-xs font-extrabold">Create your workspace</span></div>
            <div className="h-8 rounded-lg border border-white/[0.08] bg-black/20 px-2 py-2 text-[8px] text-slate-500">Workspace name</div>
            <div className="mt-2 rounded-lg bg-blue-500 py-2 text-center text-[8px] font-bold">Continue</div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-300">{source}</p>
            <StatusChip status="verified" />
          </div>
          <h3 className="mt-2 text-lg font-extrabold">{title}</h3>
        </div>
        <CheckCircle2 className="shrink-0 text-emerald-300" size={20} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{metadata}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
      <button type="button" className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-300 hover:text-blue-200">Open evidence <ExternalLink size={13} /></button>
    </PremiumCard>
  );
}
