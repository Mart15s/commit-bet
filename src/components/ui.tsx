import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-primary-foreground shadow-[0_0_26px_rgba(124,58,237,.22)] hover:bg-[#6D28D9]",
  secondary: "border border-border bg-secondary text-secondary-foreground hover:bg-elevated",
  ghost: "text-primary hover:bg-primary/10",
  dark: "bg-elevated text-foreground hover:bg-secondary",
  danger: "bg-destructive text-destructive-foreground hover:bg-[#DC2626]",
  amber: "bg-accent text-accent-foreground hover:bg-[#D97706]",
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
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
  return <section className={cn("rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-[0_1px_0_rgba(248,250,252,.04)]", className)}>{children}</section>;
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
    <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-black uppercase tracking-[.16em] text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-black tracking-[-.035em]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "approved" || normalized === "active" || normalized === "completed" || normalized === "met" || normalized === "low"
      ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-300"
      : normalized === "submitted"
        ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
        : normalized === "in_progress" || normalized === "info" || normalized === "ai"
          ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-200"
          : normalized === "needs_changes" || normalized === "medium" || normalized === "partial" || normalized === "warning"
            ? "border-amber-300/35 bg-amber-400/14 text-amber-200"
            : normalized === "disputed"
              ? "border-rose-300/35 bg-rose-500/16 text-rose-200"
              : normalized === "rejected" || normalized === "critical" || normalized === "high" || normalized === "missed"
                ? "border-red-300/35 bg-red-500/16 text-red-200"
                : "border-slate-500/40 bg-slate-700/40 text-slate-300";
  return <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-black capitalize", tone)}>{status.replaceAll("_", " ")}</span>;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(124,58,237,.45)] transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-[-.02em]">{value}</p>
          {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
        </div>
        {icon && <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">{icon}</div>}
      </div>
    </Card>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-xl font-black tracking-[-.02em]">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  copy,
  action,
  tip,
  icon,
  className,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
  tip?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("py-10 text-center", className)}>
      {icon && <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">{icon}</div>}
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{copy}</p>
      {tip && <p className="mx-auto mt-4 max-w-md rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm font-bold text-amber-100">{tip}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function HelpCard({
  title,
  children,
  tone = "primary",
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: "primary" | "cyan" | "amber" | "emerald" | "danger";
  className?: string;
}) {
  const tones = {
    primary: "border-primary/25 bg-primary/10 text-violet-100",
    cyan: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
    amber: "border-amber-300/30 bg-amber-400/10 text-amber-100",
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    danger: "border-red-400/30 bg-red-500/10 text-red-100",
  };
  return (
    <div className={cn("rounded-xl border p-4 text-sm leading-6", tones[tone], className)}>
      <p className="font-black text-foreground">{title}</p>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </div>
  );
}

export function NextActionCard({
  title,
  copy,
  action,
  className,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-amber-300/30 bg-amber-400/10", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.14em] text-amber-200">What happens next</p>
          <h2 className="mt-1 font-black">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}

export function SuccessState({
  title,
  copy,
  details,
  action,
}: {
  title: string;
  copy: string;
  details?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="border-emerald-400/30 bg-emerald-400/10">
      <div className="flex gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full border border-emerald-300/35 bg-emerald-400/15 text-xs font-black text-emerald-200">OK</div>
        <div className="min-w-0">
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
          {details && <div className="mt-4 rounded-xl border border-emerald-300/25 bg-background/45 p-3 text-sm">{details}</div>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </Card>
  );
}

export function EvidenceExamples({ compact = false }: { compact?: boolean }) {
  const examples = ["GitHub commit", "screenshot", "demo link", "Figma link", "document", "short video"];
  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "text-xs" : "text-sm")}>
      {examples.map((example) => (
        <span key={example} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 font-black text-cyan-100">
          {example}
        </span>
      ))}
    </div>
  );
}

export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-sm font-bold text-red-200">{message}</div>;
}
