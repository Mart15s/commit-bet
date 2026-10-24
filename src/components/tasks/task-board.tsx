"use client";
import { useI18n } from "@/components/language-provider";
import { CalendarDays, FileCheck2, UserRound } from "lucide-react";
import { ButtonLink, Card, StatusBadge } from "@/components/ui";

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
  { key: "todo", label: "Todo", empty: "AI-planned tasks will start here." },
  {
    key: "in_progress",
    label: "In progress",
    empty: "Work appears here once someone starts.",
  },
  {
    key: "submitted",
    label: "Submitted",
    empty: "Proof waiting for peer review lands here.",
  },
  {
    key: "approved",
    label: "Approved",
    empty: "Approved proof counts toward progress.",
  },
  {
    key: "needs_changes",
    label: "Needs changes",
    empty: "Tasks needing clearer proof show here.",
  },
  {
    key: "rejected",
    label: "Rejected",
    empty: "Only unsupported proof should land here.",
  },
  {
    key: "disputed",
    label: "Disputed",
    empty: "AI can structure disagreements here.",
  },
];

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const { t, language } = useI18n();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((column) => {
        const items = tasks.filter((task) => task.status === column.key);
        return (
          <section
            key={column.key}
            className="min-w-0 rounded-2xl border border-border bg-surface/80 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-bold">
                {t(`status.${column.key}`)}
              </h2>
              <span className="rounded-full border border-border bg-elevated px-2 py-1 text-xs font-bold text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="grid gap-3">
              {items.map((task) => (
                <ButtonLink
                  key={task.id}
                  href={`/app/tasks/${task.id}`}
                  variant="secondary"
                  className="h-auto justify-start p-0 text-left"
                >
                  <Card className="w-full border-0 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-5">{task.title}</h3>
                      <StatusBadge status={task.priority} />
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <UserRound size={14} />{" "}
                        {task.ownerName || t("Unassigned")}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays size={14} />{" "}
                        {new Intl.DateTimeFormat(
                          language === "lt" ? "lt-LT" : "en-GB",
                          { dateStyle: "medium" },
                        ).format(new Date(`${task.dueDate}T12:00:00`))}
                      </p>
                      <p className="flex items-center gap-2">
                        <FileCheck2 size={14} />{" "}
                        {task.expectedEvidenceTypes.join(", ") ||
                          t("Evidence expected")}
                      </p>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {task.acceptanceCriteria[0] ||
                        task.description ||
                        t("Acceptance criteria pending.")}
                    </p>
                  </Card>
                </ButtonLink>
              ))}
              {!items.length && (
                <div className="rounded-xl border border-dashed border-border bg-secondary/55 p-4 text-center text-xs font-bold leading-5 text-muted-foreground">
                  {t(column.empty)}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
