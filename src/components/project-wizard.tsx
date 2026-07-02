"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, CalendarDays, Check, ShieldCheck, Users } from "lucide-react";
import { createProject } from "@/app/(protected)/app/projects/actions";
import { MultiChipField, SingleChipField } from "@/components/chip-select";
import { Button, Card, ErrorMessage, HelpCard, NextActionCard, Progress, StatusBadge } from "@/components/ui";
import { useI18n } from "@/components/language-provider";
import {
  availabilityOptions,
  bestWorkTimeOptions,
  criteriaForProjectType,
  durationOptions,
  evidenceTypeOptions,
  experienceLevelOptions,
  pledgeAmountOptions,
  preferredWorkTypeOptions,
  projectTypeOptions,
  roleOptions,
  strengthOptions,
  weaknessOptions,
} from "@/lib/onboarding-options";

type Member = { id: string; name: string; email: string };
type Team = { id: string; name: string; members: Member[] };

type MemberSetup = {
  roles: string[];
  strengths: string[];
  weaknesses: string[];
  preferredWorkTypes: string[];
  evidenceTypes: string[];
  availabilityMinutesPerDay: number;
  experienceLevel: string;
  bestWorkTime: string;
  notes: string;
};

const defaultProjectType = "MVP / Startup project";
const defaultAvailability = 60;
const defaultPledge = 20;

const expectedPlan = [
  {
    titleKey: "onboarding.plan.defineRubric",
    daysFromStart: 1,
    evidenceKey: "onboarding.plan.documentEvidence",
    criteriaKey: "onboarding.plan.criteriaRubric",
  },
  {
    titleKey: "onboarding.plan.verticalSlice",
    daysFromStart: 3,
    evidenceKey: "onboarding.plan.demoEvidence",
    criteriaKey: "onboarding.plan.criteriaSlice",
  },
  {
    titleKey: "onboarding.plan.validate",
    daysFromStart: 5,
    evidenceKey: "onboarding.plan.reviewEvidence",
    criteriaKey: "onboarding.plan.criteriaReview",
  },
];

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultSetup(): MemberSetup {
  return {
    roles: [],
    strengths: [],
    weaknesses: [],
    preferredWorkTypes: [],
    evidenceTypes: [],
    availabilityMinutesPerDay: defaultAvailability,
    experienceLevel: "Beginner",
    bestWorkTime: "Flexible",
    notes: "",
  };
}

function makeSetups(members: Member[]) {
  return Object.fromEntries(members.map((member) => [member.id, defaultSetup()]));
}

function updateSetup(
  setups: Record<string, MemberSetup>,
  memberId: string,
  patch: Partial<MemberSetup>,
) {
  return {
    ...setups,
    [memberId]: {
      ...(setups[memberId] ?? defaultSetup()),
      ...patch,
    },
  };
}

function asChipOptions<T extends ReadonlyArray<{ value: string; labelKey: string; recommended?: boolean }>>(options: T) {
  return options.map((option) => ({ value: option.value, labelKey: option.labelKey, recommended: option.recommended }));
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
  const initialTeamId = initialTeam || teams[0]?.id || "";
  const initialMembers = teams.find((team) => team.id === initialTeamId)?.members ?? [];
  const [teamId, setTeamId] = useState(initialTeamId);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialMembers.map((member) => member.id));
  const [memberSetups, setMemberSetups] = useState<Record<string, MemberSetup>>(makeSetups(initialMembers));
  const [projectType, setProjectType] = useState(defaultProjectType);
  const [selectedSuccessCriteria, setSelectedSuccessCriteria] = useState<string[]>(
    criteriaForProjectType(defaultProjectType).filter((item) => item.recommended).map((item) => item.value),
  );
  const [customSuccessCriteria, setCustomSuccessCriteria] = useState<string[]>([]);
  const [duration, setDuration] = useState("14");
  const [pledgeSelection, setPledgeSelection] = useState(String(defaultPledge));
  const [customPledge, setCustomPledge] = useState(defaultPledge);
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(addDays(today, 13));
  const currentTeam = useMemo(() => teams.find((team) => team.id === teamId), [teams, teamId]);
  const selectedMembers = useMemo(
    () => currentTeam?.members.filter((member) => selectedMemberIds.includes(member.id)) ?? [],
    [currentTeam, selectedMemberIds],
  );
  const successCriteriaOptions = useMemo(() => criteriaForProjectType(projectType), [projectType]);
  const allCriteria = useMemo(
    () => [...selectedSuccessCriteria, ...customSuccessCriteria].map((item) => item.trim()).filter(Boolean),
    [customSuccessCriteria, selectedSuccessCriteria],
  );
  const pledgeAmount = pledgeSelection === "custom" ? customPledge : Number(pledgeSelection);
  const endDate = useMemo(() => {
    if (duration === "custom") return customEndDate;
    return addDays(startDate, Number(duration) - 1);
  }, [customEndDate, duration, startDate]);
  const steps = [
    "onboarding.steps.project",
    "onboarding.steps.criteria",
    "onboarding.steps.duration",
    "onboarding.steps.members",
    "onboarding.steps.pledge",
    "onboarding.steps.ai",
    "onboarding.steps.review",
  ];
  const progress = Math.round(((step + 1) / steps.length) * 100);
  const invalidSelectedMember = selectedMembers.some((member) => {
    const setup = memberSetups[member.id] ?? defaultSetup();
    return (!setup.roles.length && !setup.strengths.length) || !setup.availabilityMinutesPerDay;
  });
  const canContinue =
    (step !== 1 || allCriteria.length > 0)
    && (step < 3 || selectedMembers.length > 0)
    && (step !== 3 || !invalidSelectedMember)
    && (step !== 4 || pledgeAmount >= 0);

  function chooseTeam(nextTeamId: string) {
    const nextMembers = teams.find((team) => team.id === nextTeamId)?.members ?? [];
    setTeamId(nextTeamId);
    setSelectedMemberIds(nextMembers.map((member) => member.id));
    setMemberSetups(makeSetups(nextMembers));
  }

  function chooseProjectType(nextProjectType: string) {
    setProjectType(nextProjectType);
    setSelectedSuccessCriteria(criteriaForProjectType(nextProjectType).filter((item) => item.recommended).map((item) => item.value));
  }

  return (
    <form action={createProject} noValidate>
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="project_type" value={projectType} />
      <input type="hidden" name="start_date" value={startDate} />
      <input type="hidden" name="end_date" value={endDate} />
      <input type="hidden" name="selected_success_criteria" value={JSON.stringify(selectedSuccessCriteria)} />
      <input type="hidden" name="custom_success_criteria" value={JSON.stringify(customSuccessCriteria)} />
      <input type="hidden" name="pledge_amount" value={Number.isFinite(pledgeAmount) ? pledgeAmount : 0} />
      <input type="hidden" name="pledge_amount_is_custom" value={String(pledgeSelection === "custom")} />

      <Card className="mb-4 border-primary/25 bg-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{t("onboarding.stepCounter").replace("{current}", String(step + 1)).replace("{total}", String(steps.length))}</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-.03em]">{t(steps[step])}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("onboarding.stepHelper")}</p>
          </div>
          <span className="text-sm font-black text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-4" />
      </Card>

      <ErrorMessage message={error} />

      <Card className="mt-4 min-h-[32rem]">
        <div hidden={step !== 0}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("onboarding.stepOne")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("onboarding.projectTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.projectCopy")}</p>
            </div>
            <label>
              {t("onboarding.team")}
              <small className="font-normal text-muted-foreground">{t("onboarding.teamHelper")}</small>
              <select value={teamId} onChange={(event) => chooseTeam(event.target.value)}>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <SingleChipField
              label={t("onboarding.projectType")}
              helper={t("onboarding.projectTypeHelper")}
              options={projectTypeOptions}
              value={projectType}
              onChange={chooseProjectType}
              t={t}
              required
            />
            <label>
              {t("onboarding.projectName")}
              <small className="font-normal text-muted-foreground">{t("onboarding.projectNameHelper")}</small>
              <input name="title" required placeholder={t("onboarding.projectNamePlaceholder")} />
            </label>
            <label>
              {t("onboarding.description")}
              <small className="font-normal text-muted-foreground">{t("onboarding.descriptionHelper")}</small>
              <textarea name="description" required placeholder={t("onboarding.descriptionPlaceholder")} />
            </label>
            <label>
              {t("onboarding.mainGoal")}
              <small className="font-normal text-muted-foreground">{t("onboarding.mainGoalHelper")}</small>
              <textarea name="goal" required placeholder={t("onboarding.mainGoalPlaceholder")} />
            </label>
          </div>
        </div>

        <div hidden={step !== 1}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("onboarding.stepTwo")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("onboarding.criteriaTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.criteriaHelper")}</p>
            </div>
            <MultiChipField
              label={t("onboarding.suggestedCriteria")}
              helper={t("onboarding.successCriteriaCopy")}
              options={successCriteriaOptions}
              value={selectedSuccessCriteria}
              onChange={setSelectedSuccessCriteria}
              t={t}
              required
            />
            <MultiChipField
              label={t("onboarding.customCriteria")}
              helper={t("onboarding.customCriteriaHelper")}
              options={[]}
              value={customSuccessCriteria}
              onChange={setCustomSuccessCriteria}
              t={t}
            />
            {!allCriteria.length && <ErrorMessage message={t("onboarding.validation.criteriaRequired")} />}
          </div>
        </div>

        <div hidden={step !== 2}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">{t("onboarding.stepThree")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("onboarding.durationTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.durationHelper")}</p>
            </div>
            <label>
              {t("onboarding.startDate")}
              <small className="font-normal text-muted-foreground">{t("onboarding.startDateHelper")}</small>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDuration(option.value)}
                  className={`min-h-14 rounded-xl border px-3 font-black transition ${duration === option.value ? "border-primary bg-primary/15 text-violet-100 shadow-[0_0_22px_rgba(124,58,237,.18)]" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
                >
                  {t(option.labelKey)}
                  {"recommended" in option && option.recommended && <span className="mt-1 block text-[10px] uppercase text-amber-200">{t("common.recommended")}</span>}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDuration("custom")}
                className={`min-h-14 rounded-xl border px-3 font-black transition ${duration === "custom" ? "border-primary bg-primary/15 text-violet-100 shadow-[0_0_22px_rgba(124,58,237,.18)]" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
              >
                {t("common.custom")}
              </button>
            </div>
            {duration === "custom" && (
              <label>
                {t("onboarding.customEndDate")}
                <small className="font-normal text-muted-foreground">{t("onboarding.customEndDateHelper")}</small>
                <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} />
              </label>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm">
              <CalendarDays className="text-amber-300" size={20} />
              <span><strong>{startDate}</strong> {t("common.to")} <strong>{endDate}</strong></span>
            </div>
          </div>
        </div>

        <div hidden={step !== 3}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("onboarding.stepFour")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("onboarding.membersTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.membersHelper")}</p>
            </div>
            {currentTeam?.members.map((member) => {
              const setup = memberSetups[member.id] ?? defaultSetup();
              const isSelected = selectedMemberIds.includes(member.id);
              return (
                <fieldset key={member.id} className="grid gap-4 rounded-2xl border border-border p-4">
                  <label className="flex cursor-pointer grid-cols-none items-center gap-3">
                    <input
                      className="size-5 w-auto"
                      type="checkbox"
                      name="member_id"
                      value={member.id}
                      checked={isSelected}
                      onChange={(event) => setSelectedMemberIds((current) =>
                        event.target.checked
                          ? [...new Set([...current, member.id])]
                          : current.filter((id) => id !== member.id),
                      )}
                    />
                    <span><strong className="block">{member.name}</strong><small className="font-normal text-muted-foreground">{member.email}</small></span>
                  </label>
                  {isSelected && (
                    <div className="grid gap-5">
                      <input type="hidden" name={`roles_${member.id}`} value={JSON.stringify(setup.roles)} />
                      <input type="hidden" name={`strengths_${member.id}`} value={JSON.stringify(setup.strengths)} />
                      <input type="hidden" name={`weaknesses_${member.id}`} value={JSON.stringify(setup.weaknesses)} />
                      <input type="hidden" name={`work_types_${member.id}`} value={JSON.stringify(setup.preferredWorkTypes)} />
                      <input type="hidden" name={`evidence_types_${member.id}`} value={JSON.stringify(setup.evidenceTypes)} />
                      <input type="hidden" name={`experience_level_${member.id}`} value={setup.experienceLevel} />
                      <input type="hidden" name={`best_work_time_${member.id}`} value={setup.bestWorkTime} />
                      <input type="hidden" name={`availability_${member.id}`} value={setup.availabilityMinutesPerDay} />
                      <input type="hidden" name={`custom_notes_${member.id}`} value={setup.notes} />
                      <input type="hidden" name={`notes_${member.id}`} value={setup.notes} />

                      <MultiChipField
                        label={t("onboarding.rolesTitle")}
                        helper={t("onboarding.rolesHelper")}
                        options={roleOptions}
                        value={setup.roles}
                        onChange={(roles) => setMemberSetups((current) => updateSetup(current, member.id, { roles }))}
                        t={t}
                        required
                      />
                      <MultiChipField
                        label={t("onboarding.strengthsTitle")}
                        helper={t("onboarding.strengthsHelper")}
                        options={strengthOptions}
                        value={setup.strengths}
                        onChange={(strengths) => setMemberSetups((current) => updateSetup(current, member.id, { strengths }))}
                        t={t}
                      />
                      <MultiChipField
                        label={t("onboarding.weaknessesTitle")}
                        helper={t("onboarding.weaknessesHelper")}
                        options={weaknessOptions}
                        value={setup.weaknesses}
                        onChange={(weaknesses) => setMemberSetups((current) => updateSetup(current, member.id, { weaknesses }))}
                        t={t}
                      />
                      <MultiChipField
                        label={t("onboarding.preferredWorkTitle")}
                        helper={t("onboarding.preferredWorkHelper")}
                        options={preferredWorkTypeOptions}
                        value={setup.preferredWorkTypes}
                        onChange={(preferredWorkTypes) => setMemberSetups((current) => updateSetup(current, member.id, { preferredWorkTypes }))}
                        t={t}
                      />
                      <MultiChipField
                        label={t("onboarding.evidenceTitle")}
                        helper={t("onboarding.evidenceHelper")}
                        options={evidenceTypeOptions}
                        value={setup.evidenceTypes}
                        onChange={(evidenceTypes) => setMemberSetups((current) => updateSetup(current, member.id, { evidenceTypes }))}
                        t={t}
                      />
                      <div className="grid gap-5 md:grid-cols-2">
                        <SingleChipField
                          label={t("onboarding.availabilityTitle")}
                          helper={t("onboarding.availabilityHelper")}
                          options={asChipOptions(availabilityOptions)}
                          value={String(setup.availabilityMinutesPerDay)}
                          onChange={(value) => setMemberSetups((current) => updateSetup(current, member.id, { availabilityMinutesPerDay: Number(value) || defaultAvailability }))}
                          t={t}
                          required
                        />
                        <label>
                          {t("onboarding.customAvailability")}
                          <small className="font-normal text-muted-foreground">{t("onboarding.customAvailabilityHelper")}</small>
                          <input
                            type="number"
                            min={15}
                            max={1440}
                            value={setup.availabilityMinutesPerDay}
                            onChange={(event) => setMemberSetups((current) => updateSetup(current, member.id, { availabilityMinutesPerDay: Number(event.target.value) }))}
                          />
                        </label>
                      </div>
                      <div className="grid gap-5 md:grid-cols-2">
                        <SingleChipField
                          label={t("onboarding.experienceTitle")}
                          helper={t("onboarding.experienceHelper")}
                          options={experienceLevelOptions}
                          value={setup.experienceLevel}
                          onChange={(experienceLevel) => setMemberSetups((current) => updateSetup(current, member.id, { experienceLevel }))}
                          t={t}
                          required
                        />
                        <SingleChipField
                          label={t("onboarding.bestWorkTimeTitle")}
                          helper={t("onboarding.bestWorkTimeHelper")}
                          options={bestWorkTimeOptions}
                          value={setup.bestWorkTime}
                          onChange={(bestWorkTime) => setMemberSetups((current) => updateSetup(current, member.id, { bestWorkTime }))}
                          t={t}
                          required
                        />
                      </div>
                      <label>
                        {t("onboarding.memberNotes")}
                        <small className="font-normal text-muted-foreground">{t("onboarding.memberNotesHelper")}</small>
                        <textarea
                          className="min-h-20"
                          value={setup.notes}
                          onChange={(event) => setMemberSetups((current) => updateSetup(current, member.id, { notes: event.target.value }))}
                          placeholder={t("onboarding.memberNotesPlaceholder")}
                        />
                      </label>
                      {!setup.roles.length && !setup.strengths.length && <ErrorMessage message={t("onboarding.validation.roleOrStrength")} />}
                    </div>
                  )}
                </fieldset>
              );
            })}
            {!selectedMembers.length && <ErrorMessage message={t("onboarding.validation.memberRequired")} />}
          </div>
        </div>

        <div hidden={step !== 4}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">{t("onboarding.stepFive")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("onboarding.pledgeTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.pledgeHelper")}</p>
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-4 text-sm font-bold text-amber-200">
              {t("onboarding.pledgeTip")}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {pledgeAmountOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPledgeSelection(option.value)}
                  className={`min-h-14 rounded-xl border px-3 font-black transition ${pledgeSelection === option.value ? "border-amber-300 bg-amber-400/15 text-amber-100 shadow-[0_0_22px_rgba(245,158,11,.16)]" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
                >
                  {t(option.labelKey)}
                  {"recommended" in option && option.recommended && <span className="mt-1 block text-[10px] uppercase text-amber-200">{t("common.recommended")}</span>}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPledgeSelection("custom")}
                className={`min-h-14 rounded-xl border px-3 font-black transition ${pledgeSelection === "custom" ? "border-amber-300 bg-amber-400/15 text-amber-100 shadow-[0_0_22px_rgba(245,158,11,.16)]" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
              >
                {t("common.custom")}
              </button>
            </div>
            {pledgeSelection === "custom" && (
              <label>
                {t("onboarding.customPledge")}
                <small className="font-normal text-muted-foreground">{t("onboarding.customPledgeHelper")}</small>
                <input type="number" min={0} value={customPledge} onChange={(event) => setCustomPledge(Number(event.target.value))} />
              </label>
            )}
            <div className="rounded-xl border border-border bg-secondary p-4 text-sm">
              <strong>{t("onboarding.pledgeAppliesTo")}</strong>
              <p className="mt-1 text-muted-foreground">{t("onboarding.pledgeAppliesToCopy").replace("{points}", String(Number.isFinite(pledgeAmount) ? pledgeAmount : 0))}</p>
            </div>
          </div>
        </div>

        <div hidden={step !== 5}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">{t("onboarding.stepSix")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("onboarding.aiTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.aiHelper")}</p>
            </div>
            <HelpCard title={t("onboarding.proofExamples")} tone="cyan">
              <div className="flex flex-wrap gap-2 text-sm">
                {evidenceTypeOptions.slice(0, 6).map((option) => (
                  <span key={option.value} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 font-black text-cyan-100">
                    {t(option.labelKey)}
                  </span>
                ))}
              </div>
            </HelpCard>
            <div className="grid gap-3">
              {expectedPlan.map((task, index) => {
                const owner = selectedMembers[index % Math.max(1, selectedMembers.length)];
                return (
                  <Card key={task.titleKey} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[.12em] text-cyan-300">{t("onboarding.phase").replace("{number}", String(index + 1))}</p>
                        <h3 className="font-black">{t(task.titleKey)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("onboarding.planOwner")
                            .replace("{owner}", owner?.name || t("onboarding.selectedTeammate"))
                            .replace("{date}", addDays(startDate, task.daysFromStart))}
                        </p>
                      </div>
                      <StatusBadge status="todo" />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3"><strong>{t("onboarding.acceptance")}</strong><p className="mt-1 text-muted-foreground">{t(task.criteriaKey)}</p></div>
                      <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3"><strong>{t("onboarding.expectedEvidence")}</strong><p className="mt-1 text-muted-foreground">{t(task.evidenceKey)}</p></div>
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
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("onboarding.stepSeven")}</p>
              <h2 className="mt-1 text-2xl font-black">{t("onboarding.reviewTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.reviewHelper")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-4"><Users className="text-primary" /><p className="mt-3 text-2xl font-black">{selectedMembers.length}</p><p className="text-sm text-muted-foreground">{t("onboarding.membersMetric")}</p></Card>
              <Card className="p-4"><ShieldCheck className="text-amber-300" /><p className="mt-3 text-2xl font-black">{selectedMembers.length * pledgeAmount}</p><p className="text-sm text-muted-foreground">{t("onboarding.pointsMetric")}</p></Card>
              <Card className="p-4"><Brain className="text-cyan-300" /><p className="mt-3 text-2xl font-black">{allCriteria.length}</p><p className="text-sm text-muted-foreground">{t("onboarding.criteriaMetric")}</p></Card>
            </div>
            <div className="rounded-xl border border-border bg-secondary p-4">
              <h3 className="font-black">{t("onboarding.flowTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding.flowCopy")}</p>
            </div>
            <NextActionCard
              title={t("onboarding.readyTitle")}
              copy={t("onboarding.readyCopy")}
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-16 mt-4 flex gap-3 rounded-2xl border border-border bg-background/90 p-3 backdrop-blur md:bottom-0">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={18} /> {t("common.back")}</Button>
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((value) => value + 1)}
          >
            {t("common.continue")} <ArrowRight size={18} />
          </Button>
        ) : (
          <Button className="flex-1" type="submit" disabled={!selectedMembers.length || invalidSelectedMember || !allCriteria.length}>{t("onboarding.createDraft")} <Check size={18} /></Button>
        )}
      </div>
    </form>
  );
}
