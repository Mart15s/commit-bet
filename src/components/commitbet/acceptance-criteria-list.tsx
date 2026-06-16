import { Check, HelpCircle, X } from "lucide-react";

const config = {
  met: { icon: Check, label: "Met", className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" },
  unclear: { icon: HelpCircle, label: "Unclear", className: "border-amber-400/20 bg-amber-400/10 text-amber-300" },
  missing: { icon: X, label: "Missing", className: "border-rose-400/20 bg-rose-400/10 text-rose-300" },
};

export function AcceptanceCriteriaList({
  criteria,
}: {
  criteria: ReadonlyArray<{ label: string; status: keyof typeof config }>;
}) {
  return (
    <div className="space-y-2">
      {criteria.map((item) => {
        const status = config[item.status];
        const Icon = status.icon;
        return (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
            <span className="text-sm font-semibold text-slate-200">{item.label}</span>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${status.className}`}>
              <Icon size={12} />{status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
