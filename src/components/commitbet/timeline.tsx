import { FileCheck2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { CommitBetStatus } from "./status-chip";
import { StatusChip } from "./status-chip";

export function TimelineRoot({ children }: { children: ReactNode }) {
  return <div className="relative space-y-0">{children}</div>;
}

export function TimelineItem({
  dateRange,
  owner,
  title,
  expectedProof,
  risk,
  status,
  isLast = false,
}: {
  dateRange: string;
  owner: string;
  title: string;
  expectedProof: string;
  risk: string;
  status: CommitBetStatus;
  isLast?: boolean;
}) {
  return (
    <div className="relative grid grid-cols-[2.25rem_1fr] gap-3 pb-5">
      {!isLast && <span className="absolute bottom-0 left-[1.08rem] top-8 w-px bg-gradient-to-b from-blue-400/40 to-white/[0.06]" />}
      <span className="relative z-10 mt-1 grid size-9 place-items-center rounded-full border border-blue-400/25 bg-[#101a30] text-xs font-black text-blue-300">
        {dateRange.match(/\d+/)?.[0]}
      </span>
      <article className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-300">{dateRange}</p>
            <h3 className="mt-1 text-base font-extrabold">{title}</h3>
          </div>
          <StatusChip status={status} />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
          <span className="flex items-center gap-2"><UserRound size={14} />{owner}</span>
          <span className="flex items-center gap-2"><FileCheck2 size={14} />{expectedProof}</span>
          <span><strong className={risk === "Medium" ? "text-amber-300" : "text-emerald-300"}>{risk}</strong> risk</span>
        </div>
      </article>
    </div>
  );
}
