"use client";

import { useMemo, useState } from "react";
import { Clock3, FileUp, Link2, ListChecks, Send, Sparkles } from "lucide-react";
import { saveDailyLog } from "@/app/(protected)/app/logs/actions";
import { Button, Card, ErrorMessage, StatusBadge } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";

type Project = { id: string; title: string; tasks: Array<{ id: string; title: string; status: string }> };

export function DailyLogForm({
  projects,
  initialProject,
  error,
}: {
  projects: Project[];
  initialProject?: string;
  error?: string;
}) {
  const { t } = useTranslation();
  const [projectId, setProjectId] = useState(initialProject || projects[0]?.id || "");
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId, projects]);
  const openTasks = project?.tasks.filter((task) => task.status !== "approved") ?? [];

  return (
    <form action={saveDailyLog} className="grid gap-4">
      <ErrorMessage message={error} />
      <Card className="border-cyan-300/25 bg-cyan-400/10">
        <div className="flex gap-3">
          <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-3 text-cyan-300"><Sparkles size={20} /></div>
          <div>
            <h2 className="text-xl font-black">{t("dailyLog.title")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("dailyLog.copy")}</p>
          </div>
        </div>
      </Card>

      <Card className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
          <label>{t("common.project")}<select name="project_id" value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label>{t("common.date")}<input name="log_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        </div>

        <label>
          {t("dailyLog.completedQuestion")}
          <textarea name="summary" required className="min-h-28" placeholder={t("dailyLog.completedPlaceholder")} />
        </label>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-black"><ListChecks size={17} className="text-primary" /> {t("dailyLog.relatedTasks")}</div>
          <div className="grid gap-2">
            {openTasks.map((task) => (
              <label key={task.id} className="flex cursor-pointer grid-cols-none items-center gap-3 rounded-xl border border-border bg-secondary p-3 hover:border-primary/50">
                <input className="size-5 w-auto" type="checkbox" name="task_id" value={task.id} />
                <span className="min-w-0 flex-1"><strong className="block truncate">{task.title}</strong></span>
                <StatusBadge status={task.status} />
              </label>
            ))}
            {!openTasks.length && <div className="rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground">{t("dailyLog.noOpenTasks")}</div>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="inline-flex items-center gap-2"><Clock3 size={16} /> {t("dailyLog.timeSpent")}</span><input name="time_spent_minutes" type="number" min={0} max={1440} defaultValue={60} required /></label>
          <label><span className="inline-flex items-center gap-2"><Link2 size={16} /> {t("dailyLog.evidenceLink")}</span><input name="evidence_link" type="url" placeholder={t("dailyLog.evidenceLinkPlaceholder")} /></label>
        </div>

        <label><span className="inline-flex items-center gap-2 text-cyan-200"><FileUp size={16} /> {t("dailyLog.uploadPlaceholder")}</span><input type="file" disabled /><small className="font-normal text-muted-foreground">{t("dailyLog.uploadNote")}</small></label>
        <label>{t("dailyLog.blockers")}<textarea name="blockers" className="min-h-20" placeholder={t("dailyLog.blockersPlaceholder")} /></label>
        <label>{t("dailyLog.nextSteps")}<textarea name="next_steps" className="min-h-20" required placeholder={t("dailyLog.nextStepsPlaceholder")} /></label>
      </Card>
      <Button className="sticky bottom-16 w-full md:bottom-3" size="lg" type="submit">{t("dailyLog.submit")} <Send size={18} /></Button>
    </form>
  );
}
