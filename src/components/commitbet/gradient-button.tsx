import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "border-blue-400/40 bg-gradient-to-r from-[#2F7BFF] to-[#239DE8] text-white shadow-[0_12px_34px_rgba(47,123,255,.26)] hover:brightness-110 active:scale-[.985]",
  secondary: "border-white/12 bg-white/[0.07] text-white hover:border-white/20 hover:bg-white/[0.11] active:scale-[.985]",
  ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white",
  destructive: "border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/22 active:scale-[.985]",
};

type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
  fullWidth?: boolean;
  href?: string;
};

export function GradientButton({
  children,
  variant = "primary",
  fullWidth = false,
  href,
  className,
  type = "button",
  ...props
}: GradientButtonProps) {
  const classes = cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-extrabold tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050812] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    fullWidth && "w-full",
    className,
  );

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }

  return <button type={type} className={classes} {...props}>{children}</button>;
}
