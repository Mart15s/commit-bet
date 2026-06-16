import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 text-white", className)} aria-label="CommitBet home">
      <span className="relative grid size-9 place-items-center rounded-full border border-cyan-300/25 bg-gradient-to-br from-blue-500/25 to-cyan-400/10 shadow-[0_0_28px_rgba(47,123,255,.22)]">
        <span className="absolute inset-1 rounded-full border border-white/10" />
        <Check size={17} strokeWidth={2.8} className="relative text-cyan-300" aria-hidden="true" />
      </span>
      {!compact && <span className="text-lg font-extrabold tracking-[-0.035em]">CommitBet</span>}
    </Link>
  );
}
