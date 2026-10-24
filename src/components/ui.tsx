"use client";

import Link from "next/link";
import { useI18n } from "@/components/language-provider";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "border border-border bg-secondary text-secondary-foreground hover:bg-elevated",
  ghost: "text-primary hover:bg-primary/10",
  dark: "bg-elevated text-foreground hover:bg-secondary",
  danger: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  amber:
    "border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
};

const sizes = {
  md: "min-h-11 px-4 py-2.5",
  lg: "min-h-13 px-5 py-3.5",
  sm: "min-h-11 px-3 py-2 text-sm",
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
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
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
  const LinkComponent = href.startsWith("#") ? "a" : Link;
  return (
    <LinkComponent
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </LinkComponent>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "premium-card rounded-2xl border border-border bg-card p-5 text-card-foreground",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  eyebrowKey,
  title,
  titleKey,
  description,
  descriptionKey,
  action,
}: {
  eyebrow?: string;
  eyebrowKey?: string;
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div>
        {(eyebrow || eyebrowKey) && (
          <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[.16em] text-muted-foreground">
            {eyebrowKey ? t(eyebrowKey) : eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-[-.035em]">
          {titleKey ? t(titleKey) : title}
        </h1>
        {(description || descriptionKey) && (
          <p className="mt-2 max-w-2xl leading-6 text-muted-foreground">
            {descriptionKey ? t(descriptionKey) : description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const normalized = status.toLowerCase();
  const tone =
    normalized === "approved" ||
    normalized === "met"
      ? "border-success/30 bg-success/12 text-success"
      : normalized === "submitted"
        ? "border-review/30 bg-review/10 text-review"
        : normalized === "in_progress" ||
            normalized === "info" ||
            normalized === "ai"
          ? "border-ai/30 bg-ai/12 text-ai"
          : normalized === "urgent" || normalized === "consent_requested"
            ? "border-warning/35 bg-warning/14 text-warning"
            : normalized === "disputed"
              ? "border-review/50 border-dashed bg-review/10 text-review"
              : normalized === "rejected" ||
                  normalized === "critical" ||
                  normalized === "high" ||
                  normalized === "missed"
                ? "border-danger/35 bg-danger/16 text-danger"
                : "border-border bg-surface text-muted-foreground";
  const label = t(`status.${normalized}`);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone,
      )}
    >
      {label === `status.${normalized}` ? t(status.replaceAll("_", " ")) : label}
    </span>
  );
}

export function Progress({
  value,
  className,
  label,
  verified = false,
}: {
  value: number;
  className?: string;
  label?: string;
  verified?: boolean;
}) {
  const { t } = useI18n();
  const safeValue = Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : 0;
  return (
    <div
      role="progressbar"
      aria-label={label || t("common.progress")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", verified ? "bg-success" : "bg-primary")}
        style={{ width: `${safeValue}%` }}
      />
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
  const { t } = useI18n();
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
            {t(label)}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-[-.02em]">{value}</p>
          {detail && (
            <p className="mt-1 text-sm text-muted-foreground">{t(detail)}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl border border-border bg-background/40 p-2 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-xl font-bold tracking-[-.02em]">{t(title)}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(description)}
          </p>
        )}
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
  const { t } = useI18n();
  return (
    <Card className={cn("py-7 text-center", className)}>
      {icon && (
        <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl border border-border bg-elevated/50 text-muted-foreground">
          {icon}
        </div>
      )}
      <h2 className="text-xl font-bold">{t(title)}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t(copy)}</p>
      {tip && (
        <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-muted-foreground">
          {t(tip)}
        </p>
      )}
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
    primary: "border-primary/25 bg-primary/10 text-primary",
    cyan: "border-ai/25 bg-ai/10 text-ai",
    amber: "border-border bg-surface text-muted-foreground",
    emerald: "border-border bg-surface text-muted-foreground",
    danger: "border-danger/30 bg-danger/10 text-danger",
  };
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm leading-6",
        tones[tone],
        className,
      )}
    >
      <p className="font-bold text-foreground">{t(title)}</p>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </div>
  );
}

export function NextActionCard({
  title,
  titleKey,
  copy,
  copyKey,
  action,
  className,
}: {
  title?: string;
  titleKey?: string;
  copy?: string;
  copyKey?: string;
  action?: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <Card className={cn("border-primary/30 bg-primary/5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">
            {t("common.next")}
          </p>
          <h2 className="mt-1 font-bold">{titleKey ? t(titleKey) : title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {copyKey ? t(copyKey) : copy}
          </p>
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
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-xs font-bold text-foreground">
          OK
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{t(title)}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t(copy)}
          </p>
          {details && (
            <div className="mt-4 rounded-xl border border-border bg-background/45 p-3 text-sm">
              {details}
            </div>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </Card>
  );
}

export function EvidenceExamples({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const examples = [
    "GitHub commit",
    "screenshot",
    "demo link",
    "Figma link",
    "document",
    "short video",
  ];
  return (
    <div
      className={cn("flex flex-wrap gap-2", compact ? "text-xs" : "text-sm")}
    >
      {examples.map((example) => (
        <span
          key={example}
          className="rounded-full border border-ai/25 bg-ai/10 px-3 py-1 font-bold text-ai"
        >
          {t(`evidence.${example}`)}
        </span>
      ))}
    </div>
  );
}

export function ErrorMessage({ message }: { message?: string }) {
  const { t } = useI18n();
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-danger"
    >
      {t(message)}
    </div>
  );
}
