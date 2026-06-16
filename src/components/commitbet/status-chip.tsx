import { CheckCircle2, CircleDashed, Clock3, ShieldAlert, Sparkles, UserCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommitBetStatus =
  | "todo"
  | "in_progress"
  | "submitted"
  | "approved"
  | "needs_changes"
  | "rejected"
  | "disputed"
  | "ai_review"
  | "human_required"
  | "commitment_active"
  | "verified";

const tones: Record<CommitBetStatus, string> = {
  todo: "border-slate-400/15 bg-slate-400/10 text-slate-300",
  in_progress: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  submitted: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  needs_changes: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  rejected: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  disputed: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  ai_review: "border-purple-400/20 bg-purple-400/10 text-purple-300",
  human_required: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  commitment_active: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  verified: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
};

const icons: Record<CommitBetStatus, typeof CheckCircle2> = {
  todo: CircleDashed,
  in_progress: Clock3,
  submitted: Sparkles,
  approved: CheckCircle2,
  needs_changes: ShieldAlert,
  rejected: XCircle,
  disputed: ShieldAlert,
  ai_review: Sparkles,
  human_required: UserCheck,
  commitment_active: Clock3,
  verified: CheckCircle2,
};

export function StatusChip({ status, label }: { status: CommitBetStatus; label?: string }) {
  const Icon = icons[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold capitalize", tones[status])}>
      <Icon size={12} aria-hidden="true" />
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}
