"use client";
import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/language-provider";
import { CalendarDays, FileText, ListFilter } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import "@/app/workspace.css";

export type BoardTask = {
  id: string; title: string; description?: string | null; status: string;
  priority: string; dueDate: string; ownerName?: string;
  expectedEvidenceTypes: string[]; acceptanceCriteria: string[];
};
const columns = [
  { key: "todo", empty: "AI-planned tasks will start here." },
  { key: "in_progress", empty: "Work appears here once someone starts." },
  { key: "submitted", empty: "Proof waiting for peer review lands here." },
  { key: "approved", empty: "Approved proof counts toward progress." },
  { key: "needs_changes", empty: "Tasks needing clearer proof show here." },
  { key: "rejected", empty: "Only unsupported proof should land here." },
  { key: "disputed", empty: "AI can structure disagreements here." },
];
export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const { t, language } = useI18n();
  const [filter, setFilter] = useState("all");
  const copy = (en: string, lt: string) => language === "lt" ? lt : en;
  return <div>
    <div className="board-toolbar">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><ListFilter size={15} />{copy("Filter the board", "Filtruokite lentą")}</p>
      <div className="board-filters" role="group" aria-label={copy("Task status filter", "Užduočių būsenų filtras")}>
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{copy("All", "Visos")} · {tasks.length}</button>
        {columns.filter(column => tasks.some(task => task.status === column.key)).map(column => <button key={column.key} type="button" aria-pressed={filter === column.key} onClick={() => setFilter(column.key)}>{t(`status.${column.key}`)} · {tasks.filter(task => task.status === column.key).length}</button>)}
      </div>
    </div>
    <div className="board-grid">
      {columns.filter(column => filter === "all" || filter === column.key).map(column => {
        const items = tasks.filter(task => task.status === column.key);
        return <section key={column.key} className={`board-column ${items.length ? "" : "board-column-empty"}`} data-status={column.key}>
          <div className="board-column-head"><h2><span className="board-status-dot" />{t(`status.${column.key}`)}</h2><span className="tab-count">{items.length}</span></div>
          <div className="grid gap-2">
            {items.map(task => <Link className="board-task" key={task.id} href={`/app/tasks/${task.id}`}>
              <div className="mb-3 flex items-center justify-between gap-2"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{copy("Task", "Užduotis")}</span><StatusBadge status={task.priority} /></div>
              <h3>{task.title}</h3>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="board-task-meta"><span className="board-avatar" aria-hidden="true">{(task.ownerName || "?").slice(0, 1).toUpperCase()}</span>{task.ownerName || t("Unassigned")}</p>
                <p className="board-task-meta"><CalendarDays size={13} />{task.dueDate ? new Intl.DateTimeFormat(language === "lt" ? "lt-LT" : "en-GB", { month: "short", day: "numeric" }).format(new Date(`${task.dueDate}T12:00:00`)) : copy("No due date", "Be termino")}</p>
              </div>
              <div className="board-task-proof"><p className="flex items-center gap-1.5"><FileText size={12} />{task.expectedEvidenceTypes.map(item => t(item)).join(", ") || t("Evidence expected")}</p><p className="mt-1 line-clamp-2">{task.acceptanceCriteria[0] || task.description || t("Acceptance criteria pending.")}</p></div>
            </Link>)}
            {!items.length && <p className="board-empty">{t(column.empty)}</p>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
