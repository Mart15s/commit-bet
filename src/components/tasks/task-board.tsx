import { CalendarDays, FileCheck2, UserRound } from "lucide-react";
import { ButtonLink, Card, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export type BoardTask = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate: string;
  ownerName?: string;
  expectedEvidenceTypes: string[];
  acceptanceCriteria: string[];
};

const columns = [
  { key: "todo", label: "Todo" },
  { key: "in_progress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "needs_changes", label: "Needs changes" },
  { key: "rejected", label: "Rejected" },
  { key: "disputed", label: "Disputed" },
];

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-7">
      {columns.map((column) => {
        const items = tasks.filter((task) => task.status === column.key);
        return (
          <section key={column.key} className="min-w-0 rounded-2xl border border-[var(--line)] bg-[#f8faf5] p-3">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-black">{column.label}</h2>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-[var(--muted)]">{items.length}</span>
            </div>
            <div className="grid gap-3">
              {items.map((task) => (
                <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto justify-start p-0 text-left">
                  <Card className="w-full border-0 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black leading-5">{task.title}</h3>
                      <StatusBadge status={task.priority} />
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                      <p className="flex items-center gap-2"><UserRound size={14} /> {task.ownerName || "Unassigned"}</p>
                      <p className="flex items-center gap-2"><CalendarDays size={14} /> {formatDate(task.dueDate)}</p>
                      <p className="flex items-center gap-2"><FileCheck2 size={14} /> {task.expectedEvidenceTypes.join(", ") || "Evidence expected"}</p>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{task.acceptanceCriteria[0] || task.description || "Acceptance criteria pending."}</p>
                  </Card>
                </ButtonLink>
              ))}
              {!items.length && <div className="rounded-xl border border-dashed border-[var(--line)] bg-white/65 p-4 text-center text-xs font-bold text-[var(--muted)]">No tasks</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
