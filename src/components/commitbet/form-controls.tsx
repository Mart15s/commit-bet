import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; className?: string }) {
  const id = props.id ?? props.name;
  return (
    <label htmlFor={id} className={cn("grid gap-2 text-sm font-bold text-slate-300", className)}>
      <span>{label}</span>
      <input id={id} className="min-h-12" {...props} />
      {hint && <span className="text-xs font-normal leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; className?: string }) {
  const id = props.id ?? props.name;
  return (
    <label htmlFor={id} className={cn("grid gap-2 text-sm font-bold text-slate-300", className)}>
      <span>{label}</span>
      <textarea id={id} {...props} />
      {hint && <span className="text-xs font-normal leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

export function SegmentedControl({ items, selected }: { items: ReadonlyArray<string>; selected: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={item === selected}
          className={cn(
            "min-h-11 rounded-xl border px-3 text-sm font-extrabold",
            item === selected
              ? "border-blue-400/40 bg-blue-500/15 text-blue-200 shadow-[0_0_24px_rgba(47,123,255,.12)]"
              : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:text-white",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
      <h2 className="text-base font-extrabold">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}
