"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Clock3, FileUp, Link2, ListChecks, Loader2, Send, Sparkles } from "lucide-react";
import { saveDailyLog } from "@/app/(protected)/app/logs/actions";
import { useI18n } from "@/components/language-provider";
import { Button, Card, EmptyState, ErrorMessage, EvidenceExamples, HelpCard, StatusBadge } from "@/components/ui";

type Project = { id: string; title: string; tasks: Array<{ id: string; title: string; status: string }> };

function DailyLogSubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button className="sticky bottom-16 w-full shadow-[0_-14px_36px_rgba(2,6,23,.35)] md:bottom-3" size="lg" type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
      {pending ? t("daily.submit.pending") : t("daily.submit.default")}
    </Button>
  );
}

export function DailyLogForm({
  projects,
  initialProject,
  error,
}: {
  projects: Project[];
  initialProject?: string;
  error?: string;
}) {
  const { t } = useI18n();
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
            <h2 className="text-xl font-black">{t("daily.cardTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("daily.cardCopy")}</p>
          </div>
        </div>
      </Card>

      <Card className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
          <label>{t("daily.project")}<select name="project_id" value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label>{t("daily.date")}<input name="log_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        </div>

        <label>
          <span>{t("daily.workedOn")}</span>
          <small className="font-normal text-muted-foreground">{t("daily.workedOnHelp")}</small>
          <textarea name="summary" required className="min-h-28" placeholder={t("daily.workedOnPlaceholder")} />
        </label>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-black"><ListChecks size={17} className="text-primary" /> {t("daily.taskSupport")}</div>
          <p className="mb-3 text-sm text-muted-foreground">{t("daily.taskSupportHelp")}</p>
          <div className="grid gap-2">
            {openTasks.map((task) => (
              <label key={task.id} className="flex cursor-pointer grid-cols-none items-center gap-3 rounded-xl border border-border bg-secondary p-3 hover:border-primary/50">
                <input className="size-5 w-auto" type="checkbox" name="task_id" value={task.id} />
                <span className="min-w-0 flex-1"><strong className="block truncate">{task.title}</strong></span>
                <StatusBadge status={task.status} />
              </label>
            ))}
            {!openTasks.length && (
              <EmptyState
                title={t("daily.noTasksTitle")}
                copy={t("daily.noTasksCopy")}
                tip={t("daily.noTasksTip")}
                className="py-6"
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="inline-flex items-center gap-2"><Clock3 size={16} /> {t("daily.timeSpent")}</span><small className="font-normal text-muted-foreground">{t("daily.timeSpentHelp")}</small><input name="time_spent_minutes" type="number" min={0} max={1440} defaultValue={60} required /></label>
          <label><span className="inline-flex items-center gap-2"><Link2 size={16} /> {t("daily.addProofLink")}</span><small className="font-normal text-muted-foreground">{t("daily.addProofLinkHelp")}</small><input name="evidence_link" type="url" placeholder={t("daily.proofPlaceholder")} /></label>
        </div>

        <HelpCard title={t("daily.goodProof")} tone="cyan">
          <EvidenceExamples />
        </HelpCard>
        <label><span className="inline-flex items-center gap-2 text-cyan-200"><FileUp size={16} /> {t("daily.proofUpload")}</span><input type="file" disabled /><small className="font-normal text-muted-foreground">{t("daily.uploadHelp")}</small></label>
        <label>{t("daily.blockers")}<small className="font-normal text-muted-foreground">{t("daily.blockersHelp")}</small><textarea name="blockers" className="min-h-20" placeholder={t("daily.blockersPlaceholder")} /></label>
        <label>{t("daily.next")}<small className="font-normal text-muted-foreground">{t("daily.nextHelp")}</small><textarea name="next_steps" className="min-h-20" required placeholder={t("daily.nextPlaceholder")} /></label>
      </Card>
      <DailyLogSubmitButton />
    </form>
  );
}
