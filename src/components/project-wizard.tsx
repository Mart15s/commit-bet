"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, CalendarDays, Check, Minus, Plus, ShieldCheck, Users } from "lucide-react";
import { createProject } from "@/app/(protected)/app/projects/actions";
import { Button, Card, ErrorMessage, Progress, StatusBadge } from "@/components/ui";
import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";

type Member = { id: string; name: string; email: string };
type Team = { id: string; name: string; members: Member[] };

const expectedPlan = [
  {
    daysFromStart: 1,
  },
  {
    daysFromStart: 3,
  },
  {
    daysFromStart: 5,
  },
];

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ProjectWizard({
  teams,
  initialTeam,
  error,
}: {
  teams: Team[];
  initialTeam?: string;
  error?: string;
}) {
  const { t } = useTranslation();
  const defaultCriteria = useMemo(() => [0, 1, 2].map((index) => t(`wizard.defaultCriteria.${index}` as TranslationKey)), [t]);
  const [step, setStep] = useState(0);
  const [teamId, setTeamId] = useState(initialTeam || teams[0]?.id || "");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    teams.find((team) => team.id === (initialTeam || teams[0]?.id))?.members.map((member) => member.id) ?? [],
  );
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [duration, setDuration] = useState("14");
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(addDays(today, 13));
  const currentTeam = useMemo(() => teams.find((team) => team.id === teamId), [teams, teamId]);
  const selectedMembers = useMemo(
    () => currentTeam?.members.filter((member) => selectedMemberIds.includes(member.id)) ?? [],
    [currentTeam, selectedMemberIds],
  );
  const endDate = useMemo(() => {
    if (duration === "custom") return customEndDate;
    return addDays(startDate, Number(duration) - 1);
  }, [customEndDate, duration, startDate]);
  const steps = [0, 1, 2, 3, 4, 5, 6].map((index) => t(`wizard.steps.${index}` as TranslationKey));
  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <form action={createProject} noValidate>
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="start_date" value={startDate} />
      <input type="hidden" name="end_date" value={endDate} />
      <input type="hidden" name="success_criteria" value={criteria.filter(Boolean).join("\n")} />

      <Card className="mb-4 border-primary/25 bg-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{t("wizard.stepCount", { current: step + 1, total: steps.length })}</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-.03em]">{steps[step]}</h2>
          </div>
          <span className="text-sm font-black text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-4" />
      </Card>

      <ErrorMessage message={error} />

      <Card className="mt-4 min-h-[32rem]">
        <div hidden={step !== 0}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.basicsEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.basicsTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.basicsCopy")}</p>
            </div>
            <label>{t("wizard.team")}<select value={teamId} onChange={(event) => {
              const nextTeamId = event.target.value;
              setTeamId(nextTeamId);
              setSelectedMemberIds(teams.find((team) => team.id === nextTeamId)?.members.map((member) => member.id) ?? []);
            }}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label>{t("wizard.projectName")}<input name="title" required placeholder={t("wizard.projectNamePlaceholder")} /></label>
            <label>{t("common.description")}<textarea name="description" required placeholder={t("wizard.descriptionPlaceholder")} /></label>
            <label>{t("wizard.mainGoal")}<textarea name="goal" required placeholder={t("wizard.mainGoalPlaceholder")} /></label>
          </div>
        </div>

        <div hidden={step !== 1}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.successEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.successTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.successCopy")}</p>
            </div>
            <div className="grid gap-3">
              {criteria.map((criterion, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={criterion}
                    onChange={(event) => setCriteria((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    placeholder={t("wizard.criterionPlaceholder")}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    aria-label={t("wizard.removeCriterion")}
                    disabled={criteria.length === 1}
                    onClick={() => setCriteria((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Minus size={16} />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={() => setCriteria((items) => [...items, ""])}>
              <Plus size={16} /> {t("wizard.addCriterion")}
            </Button>
          </div>
        </div>

        <div hidden={step !== 2}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">{t("wizard.durationEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.durationTitle")}</h2>
            </div>
            <label>{t("wizard.startDate")}<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["7", "14", "30", "custom"].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDuration(days)}
                  className={`min-h-14 rounded-xl border font-black capitalize transition ${duration === days ? "border-primary bg-primary/15 text-violet-100 shadow-[0_0_22px_rgba(124,58,237,.18)]" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
                >
                  {days === "custom" ? t("wizard.custom") : t("wizard.days", { count: days })}
                </button>
              ))}
            </div>
            {duration === "custom" && <label>{t("wizard.customEndDate")}<input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} /></label>}
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm">
              <CalendarDays className="text-amber-300" size={20} />
              <span><strong>{startDate}</strong> {t("common.to")} <strong>{endDate}</strong></span>
            </div>
          </div>
        </div>

        <div hidden={step !== 3}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.teamEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.teamTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.teamCopy")}</p>
            </div>
            {currentTeam?.members.map((member) => (
              <fieldset key={member.id} className="grid gap-3 rounded-2xl border border-border p-4">
                <label className="flex cursor-pointer grid-cols-none items-center gap-3">
                  <input
                    className="size-5 w-auto"
                    type="checkbox"
                    name="member_id"
                    value={member.id}
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={(event) => setSelectedMemberIds((current) =>
                      event.target.checked
                        ? [...new Set([...current, member.id])]
                        : current.filter((id) => id !== member.id),
                    )}
                  />
                  <span><strong className="block">{member.name}</strong><small className="font-normal text-muted-foreground">{member.email}</small></span>
                </label>
                {selectedMemberIds.includes(member.id) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>{t("wizard.role")} <input name={`role_${member.id}`} placeholder={t("wizard.rolePlaceholder")} /></label>
                    <label>{t("wizard.strengths")} <input name={`strengths_${member.id}`} required placeholder={t("wizard.strengthsPlaceholder")} /></label>
                    <label>{t("wizard.weaknesses")} <input name={`weaknesses_${member.id}`} placeholder={t("wizard.weaknessesPlaceholder")} /></label>
                    <label>{t("wizard.availability")} <input name={`availability_${member.id}`} type="number" min={15} max={1440} defaultValue={120} required /></label>
                    <label className="sm:col-span-2">{t("wizard.preferredWork")} <input name={`work_types_${member.id}`} placeholder={t("wizard.preferredWorkPlaceholder")} /></label>
                    <label className="sm:col-span-2">{t("wizard.notes")} <textarea name={`notes_${member.id}`} className="min-h-20" placeholder={t("wizard.notesPlaceholder")} /></label>
                  </div>
                )}
              </fieldset>
            ))}
            {!selectedMembers.length && <ErrorMessage message={t("wizard.selectMemberError")} />}
          </div>
        </div>

        <div hidden={step !== 4}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">{t("wizard.pledgeEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.pledgeTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.pledgeCopy")}</p>
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-4 text-sm font-bold text-amber-200">
              {t("wizard.pledgeNote")}
            </div>
            {selectedMembers.map((member) => (
              <fieldset key={member.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_1.1fr]">
                <legend className="px-2 font-black">{member.name}</legend>
                <label>{t("wizard.amount")}<input name={`pledge_${member.id}`} type="number" min={0} defaultValue={30} required /></label>
                <label>{t("wizard.unit")}<select name={`currency_${member.id}`} defaultValue="POINTS"><option value="POINTS">{t("wizard.virtualPoints")}</option><option value="EUR_DECLARED">{t("wizard.eurDeclared")}</option></select></label>
              </fieldset>
            ))}
          </div>
        </div>

        <div hidden={step !== 5}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">{t("wizard.aiPreviewEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.aiPreviewTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.aiPreviewCopy")}</p>
            </div>
            <div className="grid gap-3">
              {expectedPlan.map((task, index) => {
                const owner = selectedMembers[index % Math.max(1, selectedMembers.length)];
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{t(`wizard.expectedPlan.${index}.title` as TranslationKey)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t("common.owner")}: {owner?.name || t("common.selectedTeammate")} · {t("taskDetail.due")} {addDays(startDate, task.daysFromStart)}</p>
                      </div>
                      <StatusBadge status="todo" />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3"><strong>{t("common.acceptance")}</strong><p className="mt-1 text-muted-foreground">{t(`wizard.expectedPlan.${index}.criteria` as TranslationKey)}</p></div>
                      <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3"><strong>{t("common.expectedEvidence")}</strong><p className="mt-1 text-muted-foreground">{t(`wizard.expectedPlan.${index}.evidence` as TranslationKey)}</p></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div hidden={step !== 6}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.reviewEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.reviewTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.reviewCopy")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-4"><Users className="text-primary" /><p className="mt-3 text-2xl font-black">{selectedMembers.length}</p><p className="text-sm text-muted-foreground">{t("common.members")}</p></Card>
              <Card className="p-4"><ShieldCheck className="text-amber-300" /><p className="mt-3 text-2xl font-black">{selectedMembers.length * 30}</p><p className="text-sm text-muted-foreground">{t("wizard.defaultPoints")}</p></Card>
              <Card className="p-4"><Brain className="text-cyan-300" /><p className="mt-3 text-2xl font-black">{criteria.filter(Boolean).length}</p><p className="text-sm text-muted-foreground">{t("common.criteria")}</p></Card>
            </div>
            <div className="rounded-xl border border-border bg-secondary p-4">
              <h3 className="font-black">{t("wizard.accountabilityFlow")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.accountabilityFlowCopy")}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-16 mt-4 flex gap-3 rounded-2xl border border-border bg-background/90 p-3 backdrop-blur md:bottom-0">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={18} /> {t("common.back")}</Button>
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            type="button"
            disabled={(step === 3 || step === 4 || step === 5 || step === 6) && !selectedMembers.length}
            onClick={() => setStep((value) => value + 1)}
          >
            {t("common.continue")} <ArrowRight size={18} />
          </Button>
        ) : (
          <Button className="flex-1" type="submit" disabled={!selectedMembers.length}>{t("wizard.createDraft")} <Check size={18} /></Button>
        )}
      </div>
    </form>
  );
}
