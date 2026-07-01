import { CalendarDays, Coins, FolderKanban, Gauge, PlusCircle, Users } from "lucide-react";
import { ButtonLink, Card, EmptyState, PageHeader, Progress, SectionHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, singleRelation } from "@/lib/utils";
import { daysRemaining, isProjectFilter, projectDisplayStatus, projectFilters, projectSuccessScore } from "@/lib/projects";
import { isLanguage, translate } from "@/lib/i18n";

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  goal: string;
  status: string;
  start_date: string;
  end_date: string;
  teams: { name: string } | { name: string }[] | null;
  pledges: Array<{ amount: number | string | null }> | null;
  project_member_profiles: Array<{ user_id: string }> | null;
  tasks: Array<{ status: string }> | null;
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const activeFilter = isProjectFilter(params.status) ? params.status : "all";
  const { supabase, user } = await requireUser();
  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, description, goal, status, start_date, end_date, teams(name), pledges(amount), project_member_profiles(user_id), tasks(status)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("preferred_language").eq("id", user.id).single(),
  ]);
  const language = isLanguage(profile?.preferred_language) ? profile.preferred_language : "en";
  const t = (key: string) => translate(language, key);
  const rows = ((projects ?? []) as unknown as ProjectRow[]).filter((project) => (
    activeFilter === "all" ? true : project.status === activeFilter
  ));

  return (
    <>
      <PageHeader
        eyebrow={t("nav.projects")}
        title={t("projects.title")}
        description={t("projects.description")}
        action={<ButtonLink href="/app/projects/new"><PlusCircle size={18} /> {t("projects.create")}</ButtonLink>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {projectFilters.map((filter) => (
          <ButtonLink
            key={filter}
            href={filter === "all" ? "/projects" : `/projects?status=${filter}`}
            variant={activeFilter === filter ? "primary" : "secondary"}
            size="sm"
          >
            {t(`projects.filter.${filter}`)}
          </ButtonLink>
        ))}
      </div>

      {rows.length ? (
        <section>
          <SectionHeader title={t("projects.title")} />
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((project) => {
              const tasks = project.tasks ?? [];
              const team = singleRelation(project.teams);
              const status = projectDisplayStatus(project.status, tasks);
              const score = projectSuccessScore(tasks);
              const pledgePool = (project.pledges ?? []).reduce((total, pledge) => total + Number(pledge.amount ?? 0), 0);
              const remaining = daysRemaining(project.end_date);

              return (
                <Card key={project.id} className="flex flex-col gap-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={status} />
                        <span className="text-sm font-bold text-muted-foreground">{team?.name}</span>
                      </div>
                      <h2 className="mt-3 text-2xl font-black tracking-[-.025em]">{project.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{project.goal || project.description || t("projects.noGoal")}</p>
                    </div>
                    <ButtonLink href={`/app/projects/${project.id}`} variant="secondary" size="sm">{t("projects.open")}</ButtonLink>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs font-black text-muted-foreground">
                      <span>{t("projects.successScore")}</span>
                      <span>{score}%</span>
                    </div>
                    <Progress value={score} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: project.status === "completed" ? t("projects.completed") : t("projects.daysRemaining"), value: remaining, detail: `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`, icon: <CalendarDays size={18} /> },
                      { label: t("projects.pledgePool"), value: pledgePool || 0, icon: <Coins size={18} /> },
                      { label: t("projects.members"), value: project.project_member_profiles?.length ?? 0, detail: t("projects.memberCount"), icon: <Users size={18} /> },
                      { label: t("projects.status"), value: <StatusBadge status={status} />, icon: <Gauge size={18} /> },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-border bg-secondary p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[.12em] text-muted-foreground">{metric.label}</p>
                            <div className="mt-2 text-xl font-black">{metric.value}</div>
                            {metric.detail ? <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p> : null}
                          </div>
                          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">{metric.icon}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState
          title={t("projects.emptyTitle")}
          copy={t("projects.emptyCopy")}
          icon={<FolderKanban size={24} />}
          action={<ButtonLink href="/app/projects/new">{t("projects.create")}</ButtonLink>}
        />
      )}
    </>
  );
}
