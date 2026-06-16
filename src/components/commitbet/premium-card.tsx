import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-white/[0.08] bg-[#101729]/90",
  hero: "border-blue-400/20 bg-[linear-gradient(145deg,rgba(20,29,51,.98),rgba(10,17,34,.96))]",
  ai: "border-purple-400/20 bg-[linear-gradient(145deg,rgba(35,25,66,.72),rgba(14,20,38,.96))]",
  success: "border-emerald-400/20 bg-[linear-gradient(145deg,rgba(12,53,48,.58),rgba(14,22,36,.96))]",
  warning: "border-amber-400/20 bg-[linear-gradient(145deg,rgba(64,41,13,.52),rgba(17,22,36,.96))]",
  danger: "border-rose-400/20 bg-[linear-gradient(145deg,rgba(70,24,42,.5),rgba(18,21,35,.96))]",
};

export function PremiumCard({
  children,
  variant = "default",
  glow = false,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
  glow?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border p-5 shadow-[0_18px_70px_rgba(0,0,0,.18)] sm:p-6",
        variants[variant],
        glow && "shadow-[0_24px_90px_rgba(47,123,255,.16)]",
        className,
      )}
      {...props}
    >
      {glow && <span className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-blue-500/15 blur-3xl" />}
      <div className="relative">{children}</div>
    </section>
  );
}
