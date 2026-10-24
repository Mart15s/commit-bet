"use client";

import { useActionState, useEffect, useState } from "react";
import { ExternalLink, Link2, Loader2, Send } from "lucide-react";
import { saveDailyLog } from "@/app/(protected)/app/logs/actions";
import { useI18n } from "@/components/language-provider";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorMessage,
  HelpCard,
  StatusBadge,
  SuccessState,
} from "@/components/ui";
import { localDateKey } from "@/lib/progress";
import type { DailyLogState } from "@/lib/daily-log";

type Project = {
  id: string;
  title: string;
  tasks: Array<{ id: string; title: string; status: string }>;
};
export function DailyLogForm({
  projects,
  initialProject,
  error,
  initialDate,
}: {
  projects: Project[];
  initialProject?: string;
  error?: string;
  initialDate?: string;
}) {
  const { t } = useI18n();
  const [projectId, setProjectId] = useState(
    projects.some((p) => p.id === initialProject)
      ? initialProject!
      : projects[0]?.id || "",
  );
  const [fields, setFields] = useState({
    summary: "",
    evidence_link: "",
    blockers: "",
    next_steps: "",
    time_spent_minutes: "",
    log_date: initialDate || localDateKey(),
  });
  useEffect(() => {
    window.queueMicrotask(() =>
      setFields((fields) => ({ ...fields, log_date: localDateKey() })),
    );
  }, []);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [state, action, pending] = useActionState(
    async (previous: DailyLogState, data: FormData) => {
      try {
        return await saveDailyLog(previous, data);
      } catch {
        return { error: "log.saveError" };
      }
    },
    {},
  );
  const [another, setAnother] = useState(false);
  const project = projects.find((p) => p.id === projectId);
  const openTasks =
    project?.tasks.filter(
      (task) => !["approved", "submitted", "disputed"].includes(task.status),
    ) || [];
  const field = (name: keyof typeof fields) => ({
    value: fields[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((current) => ({ ...current, [name]: e.target.value })),
  });
  if (state.saved && !another)
    return (
      <div role="status">
        <SuccessState
          title={t("log.saved")}
          copy={t("log.savedCopy")}
          action={
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href={`/app/projects/${state.projectId}`}
                variant="secondary"
              >
                {t("log.view")}
              </ButtonLink>
              <Button
                type="button"
                onClick={() => {
                  setAnother(true);
                  setFields((f) => ({
                    ...f,
                    summary: "",
                    evidence_link: "",
                    blockers: "",
                    next_steps: "",
                    time_spent_minutes: "",
                  }));
                  setTaskIds([]);
                }}
              >
                {t("log.newUpdate")}
              </Button>
            </div>
          }
        />
      </div>
    );
  return (
    <form
      action={action}
      aria-busy={pending}
      onSubmit={() => setAnother(false)}
      className="mx-auto grid max-w-3xl gap-4"
    >
      <ErrorMessage message={state.error || error} />
      <Card className="grid gap-5 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-bold">{t("log.intro")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("log.introCopy")}
          </p>
        </div>
        <label>
          {t("log.project")}
          <select
            name="project_id"
            value={projectId}
            disabled={pending}
            onChange={(e) => {
              setProjectId(e.target.value);
              setTaskIds([]);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("log.summary")}
          <small className="font-normal text-muted-foreground">
            {t("log.summaryHint")}
          </small>
          <textarea
            name="summary"
            required
            minLength={2}
            maxLength={4000}
            className="min-h-28"
            placeholder={t("log.summaryPlaceholder")}
            {...field("summary")}
          />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">{t("log.tasks")}</legend>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">
            {t("log.tasksHint")}
          </p>
          <div className="grid gap-2">
            {openTasks.map((task) => (
              <label
                key={task.id}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3"
              >
                <input
                  className="size-5 w-auto"
                  type="checkbox"
                  name="task_id"
                  value={task.id}
                  checked={taskIds.includes(task.id)}
                  onChange={(e) =>
                    setTaskIds((ids) =>
                      e.target.checked
                        ? [...ids, task.id]
                        : ids.filter((id) => id !== task.id),
                    )
                  }
                />
                <span className="flex-1 text-sm">{task.title}</span>
                <StatusBadge status={task.status} />
              </label>
            ))}
            {!openTasks.length && (
              <EmptyState
                title={t("log.noTasks")}
                copy={t("log.noTasksCopy")}
                className="py-5"
              />
            )}
          </div>
        </fieldset>
        <label>
          <span className="inline-flex items-center gap-2">
            <Link2 size={16} />
            {t("log.link")}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("common.optional")})
            </span>
          </span>
          <input
            name="evidence_link"
            type="url"
            maxLength={2000}
            placeholder="https://…"
            {...field("evidence_link")}
          />
          <small className="font-normal text-muted-foreground">
            {t("log.linkHint")}
          </small>
        </label>
        <HelpCard title={t("log.evidence")}>
          <p>{t("log.evidenceCopy")}</p>
          <div className="mt-3 grid gap-2">
            {(taskIds.length
              ? openTasks.filter((task) => taskIds.includes(task.id))
              : openTasks.slice(0, 1)
            ).map((task) => (
              <ButtonLink
                key={task.id}
                href={`/app/tasks/${task.id}#evidence-upload`}
                variant="secondary"
                size="sm"
              >
                <ExternalLink size={15} />
                {t("log.upload")}: {task.title}
              </ButtonLink>
            ))}
            {!openTasks.length && (
              <ButtonLink
                href={`/app/projects/${projectId}/tasks`}
                variant="secondary"
                size="sm"
              >
                {t("log.view")}
              </ButtonLink>
            )}
          </div>
        </HelpCard>
        <details className="rounded-xl border border-border p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            {t("log.more")}
          </summary>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                {t("log.date")}
                <input
                  name="log_date"
                  type="date"
                  required
                  {...field("log_date")}
                />
              </label>
              <label>
                {t("log.time")}
                <input
                  name="time_spent_minutes"
                  type="number"
                  min={0}
                  max={1440}
                  {...field("time_spent_minutes")}
                />
              </label>
            </div>
            <label>
              {t("log.blockers")}
              <textarea
                name="blockers"
                className="min-h-20"
                maxLength={4000}
                {...field("blockers")}
              />
            </label>
            <label>
              {t("log.next")}
              <textarea
                name="next_steps"
                className="min-h-20"
                maxLength={4000}
                {...field("next_steps")}
              />
            </label>
          </div>
        </details>
      </Card>
      <div className="submit-dock sticky z-20 rounded-2xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur">
        <Button className="w-full" size="lg" type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
          {t(pending ? "log.pending" : "log.submit")}
        </Button>
      </div>
    </form>
  );
}
