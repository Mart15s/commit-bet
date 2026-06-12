import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]",
  secondary: "border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[#f0f2ed]",
  ghost: "text-[var(--brand)] hover:bg-white/70",
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
  return <section className={cn("rounded-2xl border border-[var(--line)] bg-white p-5", className)}>{children}</section>;
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
        {eyebrow && <p className="mb-1 text-xs font-black uppercase tracking-[.16em] text-[var(--brand)]">{eyebrow}</p>}
        <h1 className="text-3xl font-black tracking-[-.035em]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved" || status === "active" || status === "completed"
      ? "bg-[#e4f4e7] text-[#28603a]"
      : status === "rejected" || status === "critical"
        ? "bg-[#fae7e7] text-[#922f2f]"
        : status === "submitted" || status === "disputed"
          ? "bg-[#fff2c9] text-[#735813]"
          : "bg-[#edf0eb] text-[#566057]";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black capitalize", tone)}>{status.replaceAll("_", " ")}</span>;
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

