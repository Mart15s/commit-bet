import { UserCheck } from "lucide-react";

export function HumanConfirmationBanner({
  title = "Human confirmation required",
  description = "AI provides a recommendation. A person reviews the evidence and confirms the final decision.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <aside className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] p-4 text-amber-50">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><UserCheck size={18} /></span>
      <div>
        <h3 className="text-sm font-extrabold">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-amber-100/65">{description}</p>
      </div>
    </aside>
  );
}
