import { cn } from "@/lib/utils";

const tones = {
  success: "from-emerald-400 to-cyan-400",
  risk: "from-amber-400 to-rose-400",
  ai: "from-purple-500 via-blue-500 to-cyan-400",
};

export function ProgressBar({
  value,
  variant = "ai",
  label,
  className,
}: {
  value: number;
  variant?: keyof typeof tones;
  label?: string;
  className?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      {label && <div className="mb-2 flex justify-between gap-3 text-xs font-bold text-slate-400"><span>{label}</span><span>{safeValue}%</span></div>}
      <div
        className="h-2.5 overflow-hidden rounded-full border border-white/[0.06] bg-black/30"
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <div className={cn("h-full rounded-full bg-gradient-to-r shadow-[0_0_18px_rgba(47,123,255,.35)]", tones[variant])} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
