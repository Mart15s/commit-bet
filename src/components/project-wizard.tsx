"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createProject } from "@/app/(protected)/app/projects/actions";
import { MultiChipField, SingleChipField } from "@/components/chip-select";
import {
  Button,
  Card,
  ErrorMessage,
  HelpCard,
  NextActionCard,
  Progress,
  StatusBadge,
} from "@/components/ui";
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
  if (!Number.isFinite(date.getTime())) return "";
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
  return Object.fromEntries(
    members.map((member) => [member.id, defaultSetup()]),
  );
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

function asChipOptions<
  T extends ReadonlyArray<{
    value: string;
    labelKey: string;
    recommended?: boolean;
  }>,
>(options: T) {
  return options.map((option) => ({
    value: option.value,
    labelKey: option.labelKey,
    recommended: option.recommended,
  }));
}

export function ProjectWizard({
  teams,
  creationRequestId,
  initialTeam,
  error,
}: {
  teams: Team[];
  creationRequestId: string;
  initialTeam?: string;
  error?: string;
}) {
  const { t } = useI18n();
  const [actionState, formAction, pending] = useActionState(createProject, {});
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState({
    title: "",
    description: "",
    goal: "",
  });
  const [stepError, setStepError] = useState("");
  useEffect(() => {
    document.getElementById("wizard-step")?.focus({ preventScroll: true });
  }, [step]);
  const initialTeamId = initialTeam || teams[0]?.id || "";
  const initialMembers =
    teams.find((team) => team.id === initialTeamId)?.members ?? [];
  const [teamId, setTeamId] = useState(initialTeamId);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialMembers.map((member) => member.id),
  );
  const [memberSetups, setMemberSetups] = useState<Record<string, MemberSetup>>(
    makeSetups(initialMembers),
  );
  const [showProjectTypes, setShowProjectTypes] = useState(false);
  const [projectType, setProjectType] = useState(defaultProjectType);
  const [selectedSuccessCriteria, setSelectedSuccessCriteria] = useState<
    string[]
  >(
    criteriaForProjectType(defaultProjectType)
      .filter((item) => item.recommended)
      .map((item) => item.value),
  );
  const [customSuccessCriteria, setCustomSuccessCriteria] = useState<string[]>(
    [],
  );
  const [duration, setDuration] = useState("14");
  const [pledgeSelection, setPledgeSelection] = useState(String(defaultPledge));
  const [customPledge, setCustomPledge] = useState(defaultPledge);
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(addDays(today, 13));
  const currentTeam = useMemo(
    () => teams.find((team) => team.id === teamId),
    [teams, teamId],
  );
  const selectedMembers = useMemo(
    () =>
      currentTeam?.members.filter((member) =>
        selectedMemberIds.includes(member.id),
      ) ?? [],
    [currentTeam, selectedMemberIds],
  );
  const successCriteriaOptions = useMemo(
    () => criteriaForProjectType(projectType),
    [projectType],
  );
  const allCriteria = useMemo(
    () =>
      [...selectedSuccessCriteria, ...customSuccessCriteria]
        .map((item) => item.trim())
        .filter(Boolean),
    [customSuccessCriteria, selectedSuccessCriteria],
  );
  const pledgeAmount =
    pledgeSelection === "custom" ? customPledge : Number(pledgeSelection);
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
    return (
      (!setup.roles.length && !setup.strengths.length) ||
      !Number.isInteger(setup.availabilityMinutesPerDay) ||
      setup.availabilityMinutesPerDay < 15 ||
      setup.availabilityMinutesPerDay > 1440
    );
  });
  const canContinue =
    (step !== 1 || (allCriteria.length > 0 && allCriteria.length <= 20)) &&
    (step < 3 || selectedMembers.length > 0) &&
    (step !== 3 || !invalidSelectedMember) &&
    (step !== 4 ||
      (Number.isFinite(pledgeAmount) &&
        pledgeAmount >= 0 &&
        pledgeAmount <= 1000000));

  function goToStep(next: number) {
    if (
      next > step &&
      step === 0 &&
      Object.values(basics).some((value) => value.trim().length < 2)
    ) {
      setStepError(t("wizard.basicsError"));
      return;
    }
    if (
      next > step &&
      step === 2 &&
      (!startDate || !endDate || endDate < startDate)
    ) {
      setStepError(t("wizard.datesError"));
      return;
    }
    setStepError("");
    setStep(next);
  }

  function chooseTeam(nextTeamId: string) {
    const nextMembers =
      teams.find((team) => team.id === nextTeamId)?.members ?? [];
    setTeamId(nextTeamId);
    setSelectedMemberIds(nextMembers.map((member) => member.id));
    setMemberSetups(makeSetups(nextMembers));
  }

  function chooseProjectType(nextProjectType: string) {
    setProjectType(nextProjectType);
    setSelectedSuccessCriteria(
      criteriaForProjectType(nextProjectType)
        .filter((item) => item.recommended)
        .map((item) => item.value),
    );
  }

  return (
    <form action={formAction} aria-busy={pending} noValidate>
      <input type="hidden" name="request_id" value={creationRequestId} />
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="project_type" value={projectType} />
      <input type="hidden" name="start_date" value={startDate} />
      <input type="hidden" name="end_date" value={endDate} />
      <input
        type="hidden"
        name="selected_success_criteria"
        value={JSON.stringify(selectedSuccessCriteria)}
      />
      <input
        type="hidden"
        name="custom_success_criteria"
        value={JSON.stringify(customSuccessCriteria)}
      />
      <input
        type="hidden"
        name="pledge_amount"
        value={Number.isFinite(pledgeAmount) ? pledgeAmount : 0}
      />
      <input
        type="hidden"
        name="pledge_amount_is_custom"
        value={String(pledgeSelection === "custom")}
      />

      <Card className="mb-4 border-primary/25 bg-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
              {t("onboarding.stepCounter")
                .replace("{current}", String(step + 1))
                .replace("{total}", String(steps.length))}
            </p>
            <h2
              id="wizard-step"
              tabIndex={-1}
              className="outline-none mt-1 text-2xl font-bold tracking-[-.03em]"
            >
              {t(steps[step])}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`wizard.stepHelp${step}`)}
            </p>
          </div>
          <span className="text-sm font-bold text-muted-foreground">
            {progress}%
          </span>
        </div>
        <Progress
          value={progress}
          label={t("onboarding.stepCounter")
            .replace("{current}", String(step + 1))
            .replace("{total}", String(steps.length))}
          className="mt-4"
        />
        <ol className="mt-4 flex flex-wrap gap-2">
          {steps.map((key, index) => (
            <li key={key}>
              <button
                type="button"
                aria-current={step === index ? "step" : undefined}
                disabled={index > step || pending}
                onClick={() => goToStep(index)}
                aria-label={`${index + 1}. ${t(key)}`}
                title={t(key)}
                className={`min-h-11 min-w-11 rounded-lg border px-3 py-2 text-xs ${step === index ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground disabled:opacity-50"}`}
              >
                {index + 1}
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <ErrorMessage message={actionState.error ?? error ?? stepError} />

      <Card className="mt-4 min-h-[32rem]">
        <div hidden={step !== 0}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("onboarding.stepOne")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {t("onboarding.projectTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.projectCopy")}
              </p>
            </div>
            <label>
              {t("onboarding.team")}
              <small className="font-normal text-muted-foreground">
                {t("onboarding.teamHelper")}
              </small>
              <select
                value={teamId}
                onChange={(event) => chooseTeam(event.target.value)}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <SingleChipField
              label={t("onboarding.projectType")}
              helper={t("onboarding.projectTypeHelper")}
              options={
                showProjectTypes
                  ? projectTypeOptions
                  : projectTypeOptions.filter(
                      (option, index) =>
                        index < 4 || option.value === projectType,
                    )
              }
              value={projectType}
              onChange={chooseProjectType}
              t={t}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-self-start"
              onClick={() => setShowProjectTypes((show) => !show)}
            >
              {t(showProjectTypes ? "wizard.fewerTypes" : "wizard.moreTypes")}
            </Button>
            <label>
              {t("onboarding.projectName")}
              <small className="font-normal text-muted-foreground">
                {t("onboarding.projectNameHelper")}
              </small>
              <input
                name="title"
                required
                minLength={2}
                maxLength={120}
                value={basics.title}
                onChange={(event) =>
                  setBasics((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder={t("onboarding.projectNamePlaceholder")}
              />
            </label>
            <label>
              {t("onboarding.description")}
              <small className="font-normal text-muted-foreground">
                {t("onboarding.descriptionHelper")}
              </small>
              <textarea
                name="description"
                required
                minLength={2}
                maxLength={2000}
                value={basics.description}
                onChange={(event) =>
                  setBasics((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder={t("onboarding.descriptionPlaceholder")}
              />
            </label>
            <label>
              {t("onboarding.mainGoal")}
              <small className="font-normal text-muted-foreground">
                {t("onboarding.mainGoalHelper")}
              </small>
              <textarea
                name="goal"
                required
                minLength={2}
                maxLength={1000}
                value={basics.goal}
                onChange={(event) =>
                  setBasics((current) => ({
                    ...current,
                    goal: event.target.value,
                  }))
                }
                placeholder={t("onboarding.mainGoalPlaceholder")}
              />
            </label>
          </div>
        </div>

        <div hidden={step !== 1}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("onboarding.stepTwo")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {t("onboarding.criteriaTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.criteriaHelper")}
              </p>
            </div>
            <HelpCard title={t("onboarding.acceptance")}>
              {t("wizard.criteriaExample")}
            </HelpCard>
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
            {!allCriteria.length && (
              <ErrorMessage
                message={t("onboarding.validation.criteriaRequired")}
              />
            )}
          </div>
        </div>

        <div hidden={step !== 2}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("onboarding.stepThree")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {t("onboarding.durationTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.durationHelper")}
              </p>
            </div>
            <label>
              {t("onboarding.startDate")}
              <small className="font-normal text-muted-foreground">
                {t("onboarding.startDateHelper")}
              </small>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDuration(option.value)}
                  className={`min-h-14 rounded-xl border px-3 font-bold transition ${duration === option.value ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
                >
                  {t(option.labelKey)}
                  {"recommended" in option && option.recommended && (
                    <span className="mt-1 block text-[10px] uppercase text-primary">
                      {t("common.recommended")}
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDuration("custom")}
                className={`min-h-14 rounded-xl border px-3 font-bold transition ${duration === "custom" ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
              >
                {t("common.custom")}
              </button>
            </div>
            {duration === "custom" && (
              <label>
                {t("onboarding.customEndDate")}
                <small className="font-normal text-muted-foreground">
                  {t("onboarding.customEndDateHelper")}
                </small>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                />
              </label>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 p-4 text-sm">
              <CalendarDays className="text-primary" size={20} />
              <span>
                <strong>{startDate}</strong> {t("common.to")}{" "}
                <strong>{endDate}</strong>
              </span>
            </div>
          </div>
        </div>

        <div hidden={step !== 3}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("onboarding.stepFour")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {t("onboarding.membersTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.membersHelper")}
              </p>
            </div>
            {currentTeam?.members.map((member) => {
              const setup = memberSetups[member.id] ?? defaultSetup();
              const isSelected = selectedMemberIds.includes(member.id);
              return (
                <fieldset
                  key={member.id}
                  className="grid gap-4 rounded-2xl border border-border p-4"
                >
                  <label className="flex cursor-pointer grid-cols-none items-center gap-3">
                    <input
                      className="size-5 w-auto"
                      type="checkbox"
                      name="member_id"
                      value={member.id}
                      checked={isSelected}
                      onChange={(event) =>
                        setSelectedMemberIds((current) =>
                          event.target.checked
                            ? [...new Set([...current, member.id])]
                            : current.filter((id) => id !== member.id),
                        )
                      }
                    />
                    <span>
                      <strong className="block">{member.name}</strong>
                      <small className="font-normal text-muted-foreground">
                        {member.email}
                      </small>
                    </span>
                  </label>
                  {isSelected && (
                    <div className="grid gap-5">
                      <input
                        type="hidden"
                        name={`roles_${member.id}`}
                        value={JSON.stringify(setup.roles)}
                      />
                      <input
                        type="hidden"
                        name={`strengths_${member.id}`}
                        value={JSON.stringify(setup.strengths)}
                      />
                      <input
                        type="hidden"
                        name={`weaknesses_${member.id}`}
                        value={JSON.stringify(setup.weaknesses)}
                      />
                      <input
                        type="hidden"
                        name={`work_types_${member.id}`}
                        value={JSON.stringify(setup.preferredWorkTypes)}
                      />
                      <input
                        type="hidden"
                        name={`evidence_types_${member.id}`}
                        value={JSON.stringify(setup.evidenceTypes)}
                      />
                      <input
                        type="hidden"
                        name={`experience_level_${member.id}`}
                        value={setup.experienceLevel}
                      />
                      <input
                        type="hidden"
                        name={`best_work_time_${member.id}`}
                        value={setup.bestWorkTime}
                      />
                      <input
                        type="hidden"
                        name={`availability_${member.id}`}
                        value={setup.availabilityMinutesPerDay}
                      />
                      <input
                        type="hidden"
                        name={`custom_notes_${member.id}`}
                        value={setup.notes}
                      />
                      <input
                        type="hidden"
                        name={`notes_${member.id}`}
                        value={setup.notes}
                      />

                      <MultiChipField
                        label={t("onboarding.rolesTitle")}
                        helper={t("onboarding.rolesHelper")}
                        options={roleOptions}
                        value={setup.roles}
                        onChange={(roles) =>
                          setMemberSetups((current) =>
                            updateSetup(current, member.id, { roles }),
                          )
                        }
                        t={t}
                        required
                      />
                      <MultiChipField
                        label={t("onboarding.strengthsTitle")}
                        helper={t("onboarding.strengthsHelper")}
                        options={strengthOptions}
                        value={setup.strengths}
                        onChange={(strengths) =>
                          setMemberSetups((current) =>
                            updateSetup(current, member.id, { strengths }),
                          )
                        }
                        t={t}
                      />
                      <div className="grid gap-5 md:grid-cols-2">
                        <SingleChipField
                          label={t("onboarding.availabilityTitle")}
                          helper={t("onboarding.availabilityHelper")}
                          options={asChipOptions(availabilityOptions)}
                          value={String(setup.availabilityMinutesPerDay)}
                          onChange={(value) =>
                            setMemberSetups((current) =>
                              updateSetup(current, member.id, {
                                availabilityMinutesPerDay:
                                  Number(value) || defaultAvailability,
                              }),
                            )
                          }
                          t={t}
                          required
                        />
                        <label>
                          {t("onboarding.customAvailability")}
                          <small className="font-normal text-muted-foreground">
                            {t("onboarding.customAvailabilityHelper")}
                          </small>
                          <input
                            type="number"
                            min={15}
                            max={1440}
                            value={setup.availabilityMinutesPerDay}
                            onChange={(event) =>
                              setMemberSetups((current) =>
                                updateSetup(current, member.id, {
                                  availabilityMinutesPerDay: Number(
                                    event.target.value,
                                  ),
                                }),
                              )
                            }
                          />
                        </label>
                      </div>
                      <details className="rounded-xl border border-border p-4">
                        <summary className="cursor-pointer text-sm font-semibold">
                          {t("wizard.details")}
                        </summary>
                        <div className="mt-4 grid gap-5">
                          {" "}
                          <MultiChipField
                            label={t("onboarding.weaknessesTitle")}
                            helper={t("onboarding.weaknessesHelper")}
                            options={weaknessOptions}
                            value={setup.weaknesses}
                            onChange={(weaknesses) =>
                              setMemberSetups((current) =>
                                updateSetup(current, member.id, { weaknesses }),
                              )
                            }
                            t={t}
                          />
                          <MultiChipField
                            label={t("onboarding.preferredWorkTitle")}
                            helper={t("onboarding.preferredWorkHelper")}
                            options={preferredWorkTypeOptions}
                            value={setup.preferredWorkTypes}
                            onChange={(preferredWorkTypes) =>
                              setMemberSetups((current) =>
                                updateSetup(current, member.id, {
                                  preferredWorkTypes,
                                }),
                              )
                            }
                            t={t}
                          />
                          <MultiChipField
                            label={t("onboarding.evidenceTitle")}
                            helper={t("onboarding.evidenceHelper")}
                            options={evidenceTypeOptions}
                            value={setup.evidenceTypes}
                            onChange={(evidenceTypes) =>
                              setMemberSetups((current) =>
                                updateSetup(current, member.id, {
                                  evidenceTypes,
                                }),
                              )
                            }
                            t={t}
                          />
                          <div className="grid gap-5 md:grid-cols-2">
                            <SingleChipField
                              label={t("onboarding.experienceTitle")}
                              helper={t("onboarding.experienceHelper")}
                              options={experienceLevelOptions}
                              value={setup.experienceLevel}
                              onChange={(experienceLevel) =>
                                setMemberSetups((current) =>
                                  updateSetup(current, member.id, {
                                    experienceLevel,
                                  }),
                                )
                              }
                              t={t}
                              required
                            />
                            <SingleChipField
                              label={t("onboarding.bestWorkTimeTitle")}
                              helper={t("onboarding.bestWorkTimeHelper")}
                              options={bestWorkTimeOptions}
                              value={setup.bestWorkTime}
                              onChange={(bestWorkTime) =>
                                setMemberSetups((current) =>
                                  updateSetup(current, member.id, {
                                    bestWorkTime,
                                  }),
                                )
                              }
                              t={t}
                              required
                            />
                          </div>
                          <label>
                            {t("onboarding.memberNotes")}
                            <small className="font-normal text-muted-foreground">
                              {t("onboarding.memberNotesHelper")}
                            </small>
                            <textarea
                              className="min-h-20"
                              value={setup.notes}
                              onChange={(event) =>
                                setMemberSetups((current) =>
                                  updateSetup(current, member.id, {
                                    notes: event.target.value,
                                  }),
                                )
                              }
                              placeholder={t(
                                "onboarding.memberNotesPlaceholder",
                              )}
                            />
                          </label>
                        </div>
                      </details>
                      {!setup.roles.length && !setup.strengths.length && (
                        <ErrorMessage
                          message={t("onboarding.validation.roleOrStrength")}
                        />
                      )}
                    </div>
                  )}
                </fieldset>
              );
            })}
            {!selectedMembers.length && (
              <ErrorMessage
                message={t("onboarding.validation.memberRequired")}
              />
            )}
          </div>
        </div>

        <div hidden={step !== 4}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("onboarding.stepFive")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {t("onboarding.pledgeTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.pledgeHelper")}
              </p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/12 p-4 text-sm font-bold text-primary">
              {t("onboarding.pledgeTip")}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {pledgeAmountOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPledgeSelection(option.value)}
                  className={`min-h-14 rounded-xl border px-3 font-bold transition ${pledgeSelection === option.value ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
                >
                  {t(option.labelKey)}
                  {"recommended" in option && option.recommended && (
                    <span className="mt-1 block text-[10px] uppercase text-primary">
                      {t("common.recommended")}
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPledgeSelection("custom")}
                className={`min-h-14 rounded-xl border px-3 font-bold transition ${pledgeSelection === "custom" ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
              >
                {t("common.custom")}
              </button>
            </div>
            {pledgeSelection === "custom" && (
              <label>
                {t("onboarding.customPledge")}
                <small className="font-normal text-muted-foreground">
                  {t("onboarding.customPledgeHelper")}
                </small>
                <input
                  type="number"
                  min={0}
                  value={customPledge}
                  onChange={(event) =>
                    setCustomPledge(Number(event.target.value))
                  }
                />
              </label>
            )}
            <div className="rounded-xl border border-border bg-secondary p-4 text-sm">
              <strong>{t("onboarding.pledgeAppliesTo")}</strong>
              <p className="mt-1 text-muted-foreground">
                {t("onboarding.pledgeAppliesToCopy").replace(
                  "{points}",
                  String(Number.isFinite(pledgeAmount) ? pledgeAmount : 0),
                )}
              </p>
            </div>
          </div>
        </div>

        <div hidden={step !== 5}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ai">
                {t("onboarding.stepSix")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {t("onboarding.aiTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.aiHelper")}
              </p>
            </div>
            <HelpCard title={t("wizard.example")} tone="cyan">
              {t("wizard.exampleCopy")}
            </HelpCard>
            <HelpCard title={t("onboarding.proofExamples")} tone="cyan">
              <div className="flex flex-wrap gap-2 text-sm">
                {evidenceTypeOptions.slice(0, 6).map((option) => (
                  <span
                    key={option.value}
                    className="rounded-full border border-ai/25 bg-ai/10 px-3 py-1 font-bold text-ai"
                  >
                    {t(option.labelKey)}
                  </span>
                ))}
              </div>
            </HelpCard>
            <div className="grid gap-3">
              {expectedPlan.map((task, index) => {
                const owner =
                  selectedMembers[index % Math.max(1, selectedMembers.length)];
                return (
                  <Card key={task.titleKey} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-ai">
                          {t("onboarding.phase").replace(
                            "{number}",
                            String(index + 1),
                          )}
                        </p>
                        <h3 className="font-bold">{t(task.titleKey)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("onboarding.planOwner")
                            .replace(
                              "{owner}",
                              owner?.name || t("onboarding.selectedTeammate"),
                            )
                            .replace(
                              "{date}",
                              addDays(startDate, task.daysFromStart),
                            )}
                        </p>
                      </div>
                      <StatusBadge status="todo" />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
                        <strong>{t("onboarding.acceptance")}</strong>
                        <p className="mt-1 text-muted-foreground">
                          {t(task.criteriaKey)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-ai/20 bg-ai/10 p-3">
                        <strong>{t("onboarding.expectedEvidence")}</strong>
                        <p className="mt-1 text-muted-foreground">
                          {t(task.evidenceKey)}
                        </p>
                      </div>
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
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("onboarding.stepSeven")}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {t("onboarding.reviewTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.reviewHelper")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <h3 className="font-bold">{t("wizard.reviewBasics")}</h3>
              <p className="mt-2 text-lg font-bold">{basics.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {basics.goal}
              </p>
              <p className="mt-2 text-sm">
                {currentTeam?.name} · {startDate} — {endDate}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {allCriteria.map((criterion) => (
                  <li key={criterion}>
                    {t(
                      successCriteriaOptions.find(
                        (option) => option.value === criterion,
                      )?.labelKey || criterion,
                    )}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => goToStep(0)}
              >
                {t("wizard.edit")}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <Users className="text-primary" />
                <p className="mt-3 text-2xl font-bold">
                  {selectedMembers.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.membersMetric")}
                </p>
              </Card>
              <Card className="p-4">
                <ShieldCheck className="text-primary" />
                <p className="mt-3 text-2xl font-bold">
                  {selectedMembers.length * pledgeAmount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.pointsMetric")}
                </p>
              </Card>
              <Card className="p-4">
                <Brain className="text-ai" />
                <p className="mt-3 text-2xl font-bold">{allCriteria.length}</p>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.criteriaMetric")}
                </p>
              </Card>
            </div>
            <div className="grid gap-3">
              {selectedMembers.map((member) => {
                const setup = memberSetups[member.id] ?? defaultSetup();
                return (
                  <div
                    key={member.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <strong>{member.name}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {setup.roles
                        .map((role) =>
                          t(
                            roleOptions.find((option) => option.value === role)
                              ?.labelKey || role,
                          ),
                        )
                        .join(", ")}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("onboarding.availabilityTitle")}:{" "}
                      {setup.availabilityMinutesPerDay} {t("common.minutes")}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-border bg-secondary p-4">
              <h3 className="font-bold">{t("onboarding.flowTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("onboarding.flowCopy")}
              </p>
            </div>
            <NextActionCard
              title={t("onboarding.readyTitle")}
              copy={t("onboarding.readyCopy")}
            />
          </div>
        </div>
      </Card>

      <div className="submit-dock sticky z-20 mt-4 flex gap-3 rounded-2xl border border-border bg-background/90 p-3 backdrop-blur">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0}
          onClick={() => goToStep(step - 1)}
        >
          <ArrowLeft size={18} /> {t("common.back")}
        </Button>
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            type="button"
            disabled={!canContinue}
            onClick={() => goToStep(step + 1)}
          >
            {t("common.continue")} <ArrowRight size={18} />
          </Button>
        ) : (
          <Button
            className="flex-1"
            type="submit"
            disabled={
              pending ||
              !selectedMembers.length ||
              invalidSelectedMember ||
              !allCriteria.length
            }
          >
            {t(pending ? "wizard.creating" : "onboarding.createDraft")}{" "}
            <Check size={18} />
          </Button>
        )}
      </div>
    </form>
  );
}
