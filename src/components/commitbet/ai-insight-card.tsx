import { ArrowRight, Database, Sparkles } from "lucide-react";
import { PremiumCard } from "./premium-card";
import { ProgressBar } from "./progress-bar";

export function AIInsightCard({
  label = "AI insight",
  recommendation,
  confidence,
  reasoning,
  suggestedAction,
  dataUsed,
}: {
  label?: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
  dataUsed?: string;
}) {
  return (
    <PremiumCard variant="ai" glow>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-purple-300">
          <Sparkles size={15} /> {label}
        </div>
        <span className="text-xs font-bold text-slate-400">{confidence}% confidence</span>
      </div>
      <h2 className="mt-4 text-xl font-black tracking-[-0.035em] sm:text-2xl">{recommendation}</h2>
      <ProgressBar className="mt-4" value={confidence} variant="ai" label="Recommendation confidence" />
      <p className="mt-4 text-sm leading-6 text-slate-300">{reasoning}</p>
      <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Suggested action</p>
        <p className="mt-2 flex items-start gap-2 text-sm font-bold text-white"><ArrowRight className="mt-0.5 shrink-0 text-cyan-300" size={16} />{suggestedAction}</p>
      </div>
      {dataUsed && <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Database size={13} />Data used: {dataUsed}</p>}
    </PremiumCard>
  );
}
