"use client";
import "@/app/workspace.css";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Layers3,
  Plus,
  FileText,
  CheckCheck,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import {
  ButtonLink,
  Card,
  EmptyState,
  ErrorMessage,
  NextActionCard,
  PageHeader,
  Progress,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import {
  dashboardMetrics,
  type Sprint,
  type WorkspaceTask,
  type WorkspaceEvidence,
  type WorkspacePledge,
} from "@/lib/dashboard";
import { localDateKey, projectProgress, sprintTime } from "@/lib/progress";

export type DashboardProps = {
  projects: Sprint[];
  tasks: WorkspaceTask[];
  pledges: WorkspacePledge[];
  evidence: WorkspaceEvidence[];
  userId: string;
  hasTeam: boolean;
  loadError?: boolean;
  initialDate: string;
  listOnly?: boolean;
};

export function Dashboard({
  projects,
  tasks,
  pledges,
  evidence,
  userId,
  hasTeam,
  loadError,
  initialDate,
  listOnly = false,
}: DashboardProps) {
  const { t, language } = useI18n();
  const [today, setToday] = useState(initialDate);
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    window.queueMicrotask(() => setToday(localDateKey()));
  }, []);
  const metrics = dashboardMetrics(projects, tasks, pledges, userId, today);
  const current =
    metrics.active.find((p) => p.id === selectedId) || metrics.active[0];
  const interpolate = (key: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
      t(key),
    );
  const date = (value: string) =>
    new Intl.DateTimeFormat(language === "lt" ? "lt-LT" : "en-GB", {
      month: "short",
      day: "numeric",
    }).format(new Date(`${value}T12:00:00`));
  const projectTasks = (id: string) =>
    tasks.filter((task) => task.project_id === id);
  function sprintCard(sprint: Sprint) {
    const rows = projectTasks(sprint.id);
    const verified = projectProgress(rows);
    return (
      <Link
        href={`/app/projects/${sprint.id}`}
        key={sprint.id}
        className="workspace-sprint-card block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold">{sprint.title}</h3>
          <StatusBadge status={sprint.status} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {sprint.goal}
        </p>
        <div className="mt-5 flex justify-between gap-3 text-xs text-muted-foreground">
          <span>{t("dash.verified")}</span>
          <strong className="text-foreground">
            {rows.length ? `${verified}%` : "—"}
          </strong>
        </div>
        <Progress
          verified
          label={t("dash.verified")}
          value={verified}
          className="mt-2"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {rows.length
            ? interpolate("dash.count", {
                approved: rows.filter((r) => r.status === "approved").length,
                total: rows.length,
              })
            : t("dash.noTasks")}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {date(sprint.start_date)} — {date(sprint.end_date)}
        </p>
      </Link>
    );
  }
  if (loadError)
    return (
      <>
        <PageHeader title={listOnly ? "nav.sprints" : "dash.title"} />
        <ErrorMessage message="dash.loadError" />
      </>
    );
  if (listOnly)
    return (
      <>
        <PageHeader
          titleKey="nav.sprints"
          descriptionKey="dash.noActiveCopy"
          action={
            <ButtonLink href="/app/projects/new">
              <Plus size={17} />
              {t("dash.new")}
            </ButtonLink>
          }
        />
        <SectionHeader title={t("dash.active")} />
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.active.map(sprintCard)}
          {!metrics.active.length && (
            <p className="text-muted-foreground">{t("dash.noActive")}</p>
          )}
        </div>
        <div className="mt-8">
          <SectionHeader title={t("dash.history")} />
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.filter((p) => p.status !== "active").map(sprintCard)}
            {!projects.length && (
              <EmptyState
                title={t("dash.noSprints")}
                copy={t("dash.welcomeCopy")}
              />
            )}
          </div>
        </div>
      </>
    );
  const draft = projects.find((project) => project.status === "draft");
  const otherProjects = projects.filter((project) => project.id !== current?.id && (current || project.id !== draft?.id));
  const currentTasks = current ? projectTasks(current.id) : [];
  const time = current
    ? sprintTime(current.start_date, current.end_date, today)
    : null;
  const nextTask = metrics.queue.find(
    (task) =>
      task.project_id === current?.id &&
      !["submitted", "disputed"].includes(task.status),
  );
  const nextReview = metrics.reviews.find(
    (task) => task.project_id === current?.id,
  );
  const nextTitle = nextReview
    ? t("dash.reviewAction")
    : nextTask?.title || t("dash.logAction");
  const nextHref = nextReview
    ? `/app/tasks/${nextReview.id}`
    : nextTask
      ? `/app/tasks/${nextTask.id}`
      : `/app/logs/new?project=${current?.id || ""}`;
  const nextCopy = nextReview
    ? t("dash.reviewCopy")
    : nextTask
      ? t("dash.focusCopy")
      : t("dash.logCopy");
  const taskLink = (task: WorkspaceTask) => (
    <Link
      key={task.id}
      href={`/app/tasks/${task.id}`}
      className="flex min-h-20 items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50"
    >
      <div>
        <strong className="block text-sm font-semibold">{task.title}</strong>
        <p className="mt-1 text-xs text-muted-foreground">
          {projects.find((p) => p.id === task.project_id)?.title}
          {task.due_date
            ? ` · ${interpolate("dash.due", { date: date(task.due_date) })}`
            : ""}
        </p>
        {task.status === "submitted" &&
          task.task_assignments?.some((a) => a.user_id === userId) && (
            <p className="mt-2 text-xs text-review">{t("dash.reviewOwn")}</p>
          )}
      </div>
      <StatusBadge status={task.status} />
    </Link>
  );
  return (
    <div className="workspace-dashboard">
      <PageHeader
        eyebrowKey="dash.eyebrow"
        titleKey="dash.title"
        descriptionKey="dash.copy"
        action={
          projects.length ? (
            <ButtonLink href="/app/projects/new" variant="secondary">
              <Plus size={17} />
              {t("dash.new")}
            </ButtonLink>
          ) : undefined
        }
      />
      {!projects.length ? (
        <EmptyState
          title={t("dash.welcome")}
          copy={t("dash.welcomeCopy")}
          icon={<Layers3 size={24} />}
          action={
            <ButtonLink href={hasTeam ? "/app/projects/new" : "/app/teams"}>
              {t(hasTeam ? "dash.new" : "dash.teamCta")}
              <ArrowRight size={17} />
            </ButtonLink>
          }
        />
      ) : !current ? (
        draft ? <section className="workspace-draft-focus">
          <div><div className="workspace-draft-icon"><Layers3 size={20} /></div><div className="flex items-center gap-3"><span className="text-xs uppercase tracking-widest text-muted-foreground">{language === "lt" ? "Kitas žingsnis" : "Your next step"}</span><StatusBadge status="draft" /></div><h2>{draft.title}</h2><p>{draft.goal}</p><p className="mt-3">{language === "lt" ? "Peržiūrėkite planą, suderinkite užduotis ir pradėkite sprintą." : "Review the plan, agree on the work, and start your sprint."}</p></div>
          <ButtonLink href={`/app/projects/${draft.id}#plan`}>{language === "lt" ? "Tęsti rengimą" : "Continue setup"}<ArrowRight size={16} /></ButtonLink>
        </section> : <EmptyState title={t("dash.noActive")} copy={t("dash.noActiveCopy")} className="py-6" action={<ButtonLink href="/app/projects/new">{t("dash.new")}<Plus size={16} /></ButtonLink>} />
      ) : (
        <>
          <div className="workspace-execution-strip">
            <div><span>{t("dash.today")}</span><strong>{metrics.todayCount}</strong></div>
            <div><span>{t("dash.pending")}</span><strong>{metrics.reviews.length}</strong></div>
            <div><span>{t("dash.active")}</span><strong>{metrics.active.length}</strong></div>
            <div><span>{t("dash.points")}</span><strong>{metrics.points}</strong></div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card className="border-primary/30 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">
                  {t("dash.current")}
                </p>
                <StatusBadge status={current.status} />
              </div>
              {metrics.active.length > 1 && (
                <label className="mt-4 text-xs">
                  {t("dash.switch")}
                  <select
                    value={current.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {metrics.active.map((sprint) => (
                      <option value={sprint.id} key={sprint.id}>
                        {sprint.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Link
                className="mt-4 line-clamp-2 block text-2xl font-bold tracking-tight hover:text-primary"
                href={`/app/projects/${current.id}`}
              >
                {current.title}
              </Link>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {current.goal}
              </p>
              {time && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays size={16} />
                  {time.ended
                    ? interpolate("dash.ended", {
                        date: date(current.end_date),
                      })
                    : time.upcoming
                      ? interpolate("dash.notStarted", {
                          date: date(current.start_date),
                        })
                      : interpolate("dash.day", {
                          day: time.day,
                          total: time.total,
                        })}
                </p>
              )}
              <div className="mt-6 flex justify-between gap-3 text-sm">
                <strong>{t("dash.verified")}</strong>
                <strong className="text-primary">
                  {currentTasks.length
                    ? `${projectProgress(currentTasks)}%`
                    : "—"}
                </strong>
              </div>
              <Progress
                verified
                label={t("dash.verified")}
                value={projectProgress(currentTasks)}
                className="mt-3"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {currentTasks.length
                  ? interpolate("dash.count", {
                      approved: currentTasks.filter(
                        (r) => r.status === "approved",
                      ).length,
                      total: currentTasks.length,
                    })
                  : t("dash.noTasks")}
              </p>
              {currentTasks.length > 0 && <>
                <div className="workspace-status-track" role="img" aria-label={language === "lt" ? "Užduočių pasiskirstymas pagal būseną" : "Tasks by current status"}>
                  {["approved", "submitted", "in_progress", "todo", "needs_changes", "rejected", "disputed"].map(status => <span key={status} data-state={status} style={{ width: `${currentTasks.filter(task => task.status === status).length / currentTasks.length * 100}%` }} />)}
                </div>
                <div className="workspace-status-legend">{["approved", "submitted", "in_progress"].map(status => <span key={status}><i data-state={status} />{t(`status.${status}`)} {currentTasks.filter(task => task.status === status).length}</span>)}</div>
              </>}
              {time && (
                <div className="mt-5 flex justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>{t("dash.elapsed")}</span>
                  <span>{time.elapsed}%</span>
                </div>
              )}
            </Card>
            <NextActionCard
              className="self-start p-6"
              title={nextTitle}
              copy={nextCopy}
              action={
                <ButtonLink href={nextHref}>
                  {t(
                    nextReview
                      ? "dash.openReview"
                      : nextTask
                        ? "dash.openTask"
                        : "nav.logToday",
                  )}
                  <ArrowRight size={17} />
                </ButtonLink>
              }
            />
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <section>
              <SectionHeader
                title={t("dash.attention")}
                description={t("dash.attentionCopy")}
              />
              <div className="space-y-3">
                {metrics.queue.slice(0, 5).map(taskLink)}
                {!metrics.queue.length && (
                  <EmptyState
                    title={t("dash.clear")}
                    copy={t("dash.clearCopy")}
                    className="py-7"
                  />
                )}
              </div>
            </section>
            <section>
              <SectionHeader
                title={t("dash.pending")}
                action={
                  <ButtonLink href="/app/approvals" size="sm" variant="ghost">
                    {t("nav.reviews")}
                    <ArrowRight size={15} />
                  </ButtonLink>
                }
              />
              <div className="space-y-3">
                {metrics.reviews.slice(0, 5).map(taskLink)}
                {!metrics.reviews.length && (
                  <EmptyState
                    title={t("dash.reviewsEmpty")}
                    copy={t("dash.reviewsEmptyCopy")}
                    className="py-7"
                  />
                )}
              </div>
            </section>
          </div>
          <section className="mt-7">
            <SectionHeader title={t("dash.activity")} />
            <div className="grid gap-3 sm:grid-cols-2">
              {evidence.map((item) => {
                const task = tasks.find((task) => task.id === item.task_id);
                return (
                  <Link
                    key={item.id}
                    href={task ? `/app/tasks/${task.id}` : "/app/projects"}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <strong className="text-sm">
                      {task?.title || t("dash.activity")}
                    </strong>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      {task?.status === "approved" ? <CheckCheck size={13} className="text-success" /> : <FileText size={13} />}
                      {task && <span>{t(`status.${task.status}`)} · </span>}
                      {new Intl.DateTimeFormat(
                        language === "lt" ? "lt-LT" : "en-GB",
                        { dateStyle: "medium" },
                      ).format(new Date(item.created_at))}
                    </p>
                  </Link>
                );
              })}
              {!evidence.length && (
                <EmptyState
                  title={t("dash.activityEmpty")}
                  copy={t("dash.activityCopy")}
                  className="py-7 sm:col-span-2"
                />
              )}
            </div>
          </section>
        </>
      )}
      {otherProjects.length > 0 && (
        <div className="mt-7">
          <SectionHeader
            title={t("dash.history")}
            action={
              <ButtonLink href="/app/projects" variant="ghost" size="sm">
                {t("nav.sprints")}
                <ArrowRight size={15} />
              </ButtonLink>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {otherProjects
              .slice(0, 4)
              .map(sprintCard)}
          </div>
        </div>
      )}
    </div>
  );
}
