import { CalendarDays, FileCheck2, UserRound } from "lucide-react";
import { T } from "@/components/i18n-text";
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
  { key: "todo", label: "status.todo", empty: "board.todoEmpty" },
  { key: "in_progress", label: "status.in_progress", empty: "board.inProgressEmpty" },
  { key: "submitted", label: "status.submitted", empty: "board.submittedEmpty" },
  { key: "approved", label: "status.approved", empty: "board.approvedEmpty" },
  { key: "needs_changes", label: "status.needs_changes", empty: "board.needsChangesEmpty" },
  { key: "rejected", label: "status.rejected", empty: "board.rejectedEmpty" },
  { key: "disputed", label: "status.disputed", empty: "board.disputedEmpty" },
] as const;

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-7">
      {columns.map((column) => {
        const items = tasks.filter((task) => task.status === column.key);
        return (
          <section key={column.key} className="min-w-0 rounded-2xl border border-border bg-surface/80 p-3">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-black"><T k={column.label} /></h2>
              <span className="rounded-full border border-border bg-elevated px-2 py-1 text-xs font-black text-muted-foreground">{items.length}</span>
            </div>
            <div className="grid gap-3">
              {items.map((task) => (
                <ButtonLink key={task.id} href={`/app/tasks/${task.id}`} variant="secondary" className="h-auto justify-start p-0 text-left">
                  <Card className="w-full border-0 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black leading-5">{task.title}</h3>
                      <StatusBadge status={task.priority} />
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <p className="flex items-center gap-2"><UserRound size={14} /> {task.ownerName || <T k="ui.unassigned" />}</p>
                      <p className="flex items-center gap-2"><CalendarDays size={14} /> {formatDate(task.dueDate)}</p>
                      <p className="flex items-center gap-2"><FileCheck2 size={14} /> {task.expectedEvidenceTypes.join(", ") || <T k="ui.evidenceExpected" />}</p>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.acceptanceCriteria[0] || task.description || <T k="ui.acceptanceCriteriaPending" />}</p>
                  </Card>
                </ButtonLink>
              ))}
              {!items.length && <div className="rounded-xl border border-dashed border-border bg-secondary/55 p-4 text-center text-xs font-bold leading-5 text-muted-foreground"><T k={column.empty} /></div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
