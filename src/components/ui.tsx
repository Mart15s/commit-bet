import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "border-blue-400/40 bg-gradient-to-r from-[var(--brand)] to-[#239DE8] text-white shadow-[0_12px_34px_rgba(47,123,255,.24)] hover:brightness-110",
  secondary: "border border-[var(--line-strong)] bg-white/[0.06] text-[var(--foreground)] hover:border-white/20 hover:bg-white/[0.1]",
  ghost: "text-blue-300 hover:bg-white/[0.06] hover:text-white",
  danger: "border border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/24",
};

const sizes = {
  md: "min-h-11 px-4 py-2.5",
  lg: "min-h-13 px-5 py-3.5",
  sm: "min-h-9 px-3 py-2 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border font-extrabold outline-none transition active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050812]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-extrabold outline-none transition active:scale-[.985] focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050812]",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-[var(--line)] bg-[var(--card)]/88 p-5 shadow-[0_16px_60px_rgba(0,0,0,.16)]", className)}>
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-black uppercase tracking-[.16em] text-blue-300">{eyebrow}</p>}
        <h1 className="text-3xl font-black tracking-[-.045em] text-white">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved" || status === "active" || status === "completed"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : status === "rejected" || status === "critical"
        ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
        : status === "submitted" || status === "disputed"
          ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
          : "border-slate-400/15 bg-slate-400/10 text-slate-300";
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-black capitalize", tone)}>{status.replaceAll("_", " ")}</span>;
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <Card className="py-10 text-center">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[var(--muted)]">{copy}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-200">{message}</div>;
}
