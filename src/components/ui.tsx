import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]",
  secondary: "border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[#f0f2ed]",
  ghost: "text-[var(--brand)] hover:bg-white/70",
  dark: "bg-[var(--foreground)] text-white hover:bg-[#223027]",
  danger: "bg-[var(--danger)] text-white hover:bg-[#812525]",
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
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50",
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition",
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
  return <section className={cn("rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_1px_0_rgba(23,32,25,.04)]", className)}>{children}</section>;
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
        {eyebrow && <p className="mb-1 text-xs font-black uppercase tracking-[.16em] text-[var(--brand)]">{eyebrow}</p>}
        <h1 className="text-3xl font-black tracking-[-.035em]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "approved" || normalized === "active" || normalized === "completed" || normalized === "met" || normalized === "low"
      ? "bg-[#e4f4e7] text-[#28603a]"
      : normalized === "rejected" || normalized === "critical" || normalized === "high" || normalized === "missed"
        ? "bg-[#fae7e7] text-[#922f2f]"
        : normalized === "submitted" || normalized === "disputed" || normalized === "medium" || normalized === "partial"
          ? "bg-[#fff2c9] text-[#735813]"
          : normalized === "in_progress"
            ? "bg-[#e5eefc] text-[#254c85]"
            : normalized === "needs_changes"
              ? "bg-[#f3e8ff] text-[#6b3d99]"
              : "bg-[#edf0eb] text-[#566057]";
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black capitalize", tone)}>{status.replaceAll("_", " ")}</span>;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-[#dde3db]", className)}>
      <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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
          <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-[-.02em]">{value}</p>
          {detail && <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>}
        </div>
        {icon && <div className="rounded-xl bg-[#eef3ec] p-2 text-[var(--brand)]">{icon}</div>}
      </div>
    </Card>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-xl font-black tracking-[-.02em]">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
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
  return <div className="rounded-xl bg-[#fae7e7] p-3 text-sm font-bold text-[#922f2f]">{message}</div>;
}
