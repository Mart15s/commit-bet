"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, CalendarDays, Check, Minus, Plus, ShieldCheck, Users } from "lucide-react";
import { createProject } from "@/app/(protected)/app/projects/actions";
import { useI18n } from "@/components/language-provider";
import { Button, Card, ErrorMessage, EvidenceExamples, HelpCard, NextActionCard, Progress, StatusBadge } from "@/components/ui";

type Member = { id: string; name: string; email: string };
type Team = { id: string; name: string; members: Member[] };

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
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [teamId, setTeamId] = useState(initialTeam || teams[0]?.id || "");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    teams.find((team) => team.id === (initialTeam || teams[0]?.id))?.members.map((member) => member.id) ?? [],
  );
  const [criteria, setCriteria] = useState(() => [
    t("wizard.defaultCriterion1"),
    t("wizard.defaultCriterion2"),
    t("wizard.defaultCriterion3"),
  ]);
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
  const steps = [
    t("wizard.step1"),
    t("wizard.step2"),
    t("wizard.step3"),
    t("wizard.step4"),
    t("wizard.step5"),
    t("wizard.step6"),
    t("wizard.step7"),
  ];
  const expectedPlan = [
    {
      title: t("wizard.planTask1"),
      daysFromStart: 1,
      evidence: t("wizard.planTask1Evidence"),
      criteria: t("wizard.planTask1Criteria"),
    },
    {
      title: t("wizard.planTask2"),
      daysFromStart: 3,
      evidence: t("wizard.planTask2Evidence"),
      criteria: t("wizard.planTask2Criteria"),
    },
    {
      title: t("wizard.planTask3"),
      daysFromStart: 5,
      evidence: t("wizard.planTask3Evidence"),
      criteria: t("wizard.planTask3Criteria"),
    },
  ];
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
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{t("wizard.stepCount")} {step + 1} {t("wizard.of")} {steps.length}</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-.03em]">{steps[step]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("wizard.stepIntro")}</p>
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
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.stepCount")} 1</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.step1")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.step1Copy")}</p>
            </div>
            <label>{t("wizard.team")}<small className="font-normal text-muted-foreground">{t("wizard.teamHelp")}</small><select value={teamId} onChange={(event) => {
              const nextTeamId = event.target.value;
              setTeamId(nextTeamId);
              setSelectedMemberIds(teams.find((team) => team.id === nextTeamId)?.members.map((member) => member.id) ?? []);
            }}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label>{t("wizard.projectName")}<small className="font-normal text-muted-foreground">{t("wizard.projectNameHelp")}</small><input name="title" required placeholder={t("wizard.projectNamePlaceholder")} /></label>
            <label>{t("wizard.description")}<small className="font-normal text-muted-foreground">{t("wizard.descriptionHelp")}</small><textarea name="description" required placeholder={t("wizard.descriptionPlaceholder")} /></label>
            <label>{t("wizard.mainGoal")}<small className="font-normal text-muted-foreground">{t("wizard.mainGoalHelp")}</small><textarea name="goal" required placeholder={t("wizard.mainGoalPlaceholder")} /></label>
            <HelpCard title={t("wizard.goodGoals")}>
              {t("wizard.goodGoalsCopy")}
            </HelpCard>
          </div>
        </div>

        <div hidden={step !== 1}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.stepCount")} 2</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.step2")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.step2Copy")}</p>
            </div>
            <HelpCard title={t("wizard.criteriaExample")} tone="amber">
              {t("wizard.criteriaExampleCopy")}
            </HelpCard>
            <div className="grid gap-3">
              {criteria.map((criterion, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    aria-label={`${t("wizard.criterionAria")} ${index + 1}`}
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
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">{t("wizard.stepCount")} 3</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.step3")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.step3Copy")}</p>
            </div>
            <label>{t("wizard.startDate")}<small className="font-normal text-muted-foreground">{t("wizard.startDateHelp")}</small><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["7", "14", "30", "custom"].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDuration(days)}
                  className={`min-h-14 rounded-xl border font-black capitalize transition ${duration === days ? "border-primary bg-primary/15 text-violet-100 shadow-[0_0_22px_rgba(124,58,237,.18)]" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
                >
                  {days === "custom" ? t("wizard.custom") : `${days} ${t("wizard.days")}`}
                </button>
              ))}
            </div>
            {duration === "custom" && <label>{t("wizard.customEndDate")}<small className="font-normal text-muted-foreground">{t("wizard.customEndDateHelp")}</small><input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} /></label>}
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm">
              <CalendarDays className="text-amber-300" size={20} />
              <span><strong>{startDate}</strong> {t("wizard.to")} <strong>{endDate}</strong></span>
            </div>
          </div>
        </div>

        <div hidden={step !== 3}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.stepCount")} 4</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.step4")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.step4Copy")}</p>
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
                    <label>{t("wizard.role")} <small className="font-normal text-muted-foreground">{t("wizard.roleHelp")}</small><input name={`role_${member.id}`} placeholder={t("wizard.rolePlaceholder")} /></label>
                    <label>{t("wizard.strengths")} <small className="font-normal text-muted-foreground">{t("wizard.strengthsHelp")}</small><input name={`strengths_${member.id}`} required placeholder={t("wizard.strengthsPlaceholder")} /></label>
                    <label>{t("wizard.growthEdges")} <small className="font-normal text-muted-foreground">{t("wizard.growthEdgesHelp")}</small><input name={`weaknesses_${member.id}`} placeholder={t("wizard.growthEdgesPlaceholder")} /></label>
                    <label>{t("wizard.availability")} <small className="font-normal text-muted-foreground">{t("wizard.availabilityHelp")}</small><input name={`availability_${member.id}`} type="number" min={15} max={1440} defaultValue={120} required /></label>
                    <label className="sm:col-span-2">{t("wizard.preferredWork")} <small className="font-normal text-muted-foreground">{t("wizard.preferredWorkHelp")}</small><input name={`work_types_${member.id}`} placeholder={t("wizard.preferredWorkPlaceholder")} /></label>
                    <label className="sm:col-span-2">{t("wizard.notes")} <small className="font-normal text-muted-foreground">{t("wizard.notesHelp")}</small><textarea name={`notes_${member.id}`} className="min-h-20" placeholder={t("wizard.notesPlaceholder")} /></label>
                  </div>
                )}
              </fieldset>
            ))}
            {!selectedMembers.length && <ErrorMessage message={t("wizard.selectMember")} />}
          </div>
        </div>

        <div hidden={step !== 4}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">{t("wizard.stepCount")} 5</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.step5")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.step5Copy")}</p>
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-4 text-sm font-bold text-amber-200">
              {t("wizard.beginnerTip")}
            </div>
            {selectedMembers.map((member) => (
              <fieldset key={member.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_1.1fr]">
                <legend className="px-2 font-black">{member.name}</legend>
                <label>{t("wizard.pledgeAmount")}<small className="font-normal text-muted-foreground">{t("wizard.pledgeAmountHelp")}</small><input name={`pledge_${member.id}`} type="number" min={0} defaultValue={30} required /></label>
                <label>{t("wizard.unit")}<small className="font-normal text-muted-foreground">{t("wizard.unitHelp")}</small><select name={`currency_${member.id}`} defaultValue="POINTS"><option value="POINTS">{t("wizard.virtualPoints")}</option><option value="EUR_DECLARED">{t("wizard.eurDeclared")}</option></select></label>
              </fieldset>
            ))}
          </div>
        </div>

        <div hidden={step !== 5}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">{t("wizard.stepCount")} 6</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.step6")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.step6Copy")}</p>
            </div>
            <HelpCard title={t("wizard.proofExamples")} tone="cyan">
              <EvidenceExamples />
            </HelpCard>
            <div className="grid gap-3">
              {expectedPlan.map((task, index) => {
                const owner = selectedMembers[index % Math.max(1, selectedMembers.length)];
                return (
                  <Card key={task.title} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[.12em] text-cyan-300">{t("project.phase")} {index + 1}</p>
                        <h3 className="font-black">{task.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t("wizard.owner")} {owner?.name || t("wizard.selectedTeammate")} - {t("wizard.due")} {addDays(startDate, task.daysFromStart)} - {t("wizard.assignedFrom")}</p>
                      </div>
                      <StatusBadge status="todo" />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3"><strong>{t("wizard.acceptance")}</strong><p className="mt-1 text-muted-foreground">{task.criteria}</p></div>
                      <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3"><strong>{t("project.expectedEvidence")}</strong><p className="mt-1 text-muted-foreground">{task.evidence}</p></div>
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
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("wizard.stepCount")} 7</p>
              <h2 className="mt-1 text-2xl font-black">{t("wizard.step7")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.step7Copy")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-4"><Users className="text-primary" /><p className="mt-3 text-2xl font-black">{selectedMembers.length}</p><p className="text-sm text-muted-foreground">{t("wizard.members")}</p></Card>
              <Card className="p-4"><ShieldCheck className="text-amber-300" /><p className="mt-3 text-2xl font-black">{selectedMembers.length * 30}</p><p className="text-sm text-muted-foreground">{t("wizard.defaultPoints")}</p></Card>
              <Card className="p-4"><Brain className="text-cyan-300" /><p className="mt-3 text-2xl font-black">{criteria.filter(Boolean).length}</p><p className="text-sm text-muted-foreground">{t("wizard.criteria")}</p></Card>
            </div>
            <div className="rounded-xl border border-border bg-secondary p-4">
              <h3 className="font-black">{t("wizard.accountabilityFlow")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("wizard.flow")}</p>
            </div>
            <NextActionCard
              title={t("wizard.readyDraft")}
              copy={t("wizard.readyDraftCopy")}
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-16 mt-4 flex gap-3 rounded-2xl border border-border bg-background/90 p-3 backdrop-blur md:bottom-0">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={18} /> {t("wizard.back")}</Button>
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            type="button"
            disabled={(step === 3 || step === 4 || step === 5 || step === 6) && !selectedMembers.length}
            onClick={() => setStep((value) => value + 1)}
          >
            {t("wizard.continue")} <ArrowRight size={18} />
          </Button>
        ) : (
          <Button className="flex-1" type="submit" disabled={!selectedMembers.length}>{t("wizard.createDraft")} <Check size={18} /></Button>
        )}
      </div>
    </form>
  );
}
