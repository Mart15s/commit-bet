import { FileUp, FileText, GitBranch, Link2, PenTool, Upload } from "lucide-react";
import { PremiumCard } from "./premium-card";

const sources = [
  { label: "GitHub", icon: GitBranch },
  { label: "Figma", icon: PenTool },
  { label: "Docs", icon: FileText },
  { label: "URL", icon: Link2 },
  { label: "Upload", icon: Upload },
];

export function EvidenceUploadCard({
  headline = "Upload evidence",
  subtext = "Drop files or connect verified sources.",
}: {
  headline?: string;
  subtext?: string;
}) {
  return (
    <PremiumCard variant="hero" className="p-4 sm:p-5">
      <div className="rounded-2xl border border-dashed border-blue-400/30 bg-blue-500/[0.055] px-4 py-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
          <FileUp size={23} />
        </span>
        <h2 className="mt-4 text-lg font-extrabold">{headline}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtext}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {sources.map(({ label, icon: Icon }) => (
          <button key={label} type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-3 text-xs font-bold text-slate-300 hover:border-blue-400/30 hover:text-white">
            <Icon size={15} />{label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Strong proof includes a link, screenshot, commit, or recorded walkthrough.</p>
    </PremiumCard>
  );
}
