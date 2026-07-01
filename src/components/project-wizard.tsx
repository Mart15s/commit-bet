"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, CalendarDays, Check, Minus, Plus, ShieldCheck, Users } from "lucide-react";
import { createProject } from "@/app/(protected)/app/projects/actions";
import { AIEnhanceButton } from "@/components/ai-controls";
import { Button, Card, ErrorMessage, EvidenceExamples, HelpCard, NextActionCard, Progress, StatusBadge } from "@/components/ui";

type Member = { id: string; name: string; email: string };
type Team = { id: string; name: string; members: Member[] };

const defaultCriteria = [
  "Core product flow is visible to a new user",
  "Daily evidence can be attached to active tasks",
  "Peer approval clearly compares evidence to criteria",
];

const expectedPlan = [
  {
    title: "Define commitment and proof rubric",
    daysFromStart: 1,
    evidence: "document",
    criteria: "Success criteria mapped to evidence types",
  },
  {
    title: "Ship the first working vertical slice",
    daysFromStart: 3,
    evidence: "demo link",
    criteria: "End-to-end flow can be reviewed by a teammate",
  },
  {
    title: "Collect daily logs and peer approvals",
    daysFromStart: 5,
    evidence: "screenshots and review comments",
    criteria: "At least one submitted task has human approval",
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
  const steps = [
    "What are you trying to finish?",
    "How will you know it worked?",
    "When is the finish line?",
    "Who is committing with you?",
    "What is everyone putting at stake?",
    "Let AI create your action plan",
    "Review everything before starting",
  ];
  const progress = Math.round(((step + 1) / steps.length) * 100);
  const enhanceCriteria = (text: string) => {
    const nextCriteria = text
      .split("\n")
      .map((item) => item.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    if (nextCriteria.length) setCriteria(nextCriteria);
  };

  return (
    <form action={createProject} noValidate>
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="start_date" value={startDate} />
      <input type="hidden" name="end_date" value={endDate} />
      <input type="hidden" name="success_criteria" value={criteria.filter(Boolean).join("\n")} />

      <Card className="mb-4 border-primary/25 bg-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary">Step {step + 1} of {steps.length}</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-.03em]">{steps[step]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">We will only ask for what AI and your teammates need at this step.</p>
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
              <p className="text-xs font-black uppercase tracking-wider text-primary">Step 1</p>
              <h2 className="mt-1 text-2xl font-black">What are you trying to finish?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Describe the real-world outcome, not every task. AI will help break it down later.</p>
            </div>
            <label>Team<small className="font-normal text-muted-foreground">Choose the small group that will commit and review proof together.</small><select value={teamId} onChange={(event) => {
              const nextTeamId = event.target.value;
              setTeamId(nextTeamId);
              setSelectedMemberIds(teams.find((team) => team.id === nextTeamId)?.members.map((member) => member.id) ?? []);
            }}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label>Project name<small className="font-normal text-muted-foreground">Short and concrete, like the name you would put on a sprint board.</small><input name="title" required placeholder="Launch the first CommitBet waitlist" /></label>
            <label>Description<small className="font-normal text-muted-foreground">One or two sentences about what you are building and why it matters now.</small><textarea name="description" required placeholder="We want to validate whether small teams will use proof-based commitments to finish a launch." /></label>
            <AIEnhanceButton targetName="description" context="project_description" />
            <label>Main goal<small className="font-normal text-muted-foreground">Write the outcome a teammate could check at the deadline.</small><textarea name="goal" required placeholder="Launch a landing page, collect 20 waitlist emails, and record a 2-minute demo video within 14 days." /></label>
            <AIEnhanceButton targetName="goal" context="project_goal" />
            <HelpCard title="Good goals are visible at the finish line.">
              Instead of &quot;build a startup&quot;, use &quot;launch a landing page, collect 20 waitlist emails, and record a 2-minute demo video within 14 days.&quot;
            </HelpCard>
          </div>
        </div>

        <div hidden={step !== 1}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">Step 2</p>
              <h2 className="mt-1 text-2xl font-black">How will you know it worked?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Success criteria are the rules your team will use later. Make each one specific enough to prove.</p>
            </div>
            <HelpCard title="Success criteria example" tone="amber">
              Bad: &quot;Build a startup.&quot; Good: &quot;Launch a landing page, collect 20 waitlist emails, and record a 2-minute demo video within 14 days.&quot;
            </HelpCard>
            <div className="grid gap-3">
              {criteria.map((criterion, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    aria-label={`Success criterion ${index + 1}`}
                    value={criterion}
                    onChange={(event) => setCriteria((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    placeholder="Example: Final demo can be opened by a reviewer and shows the core flow end to end"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    aria-label="Remove criterion"
                    disabled={criteria.length === 1}
                    onClick={() => setCriteria((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Minus size={16} />
                  </Button>
                </div>
              ))}
            </div>
            <AIEnhanceButton
              context="success_criteria"
              value={criteria.filter(Boolean).join("\n")}
              onEnhanced={enhanceCriteria}
            />
            <Button type="button" variant="secondary" onClick={() => setCriteria((items) => [...items, ""])}>
              <Plus size={16} /> Add criterion
            </Button>
          </div>
        </div>

        <div hidden={step !== 2}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">Step 3</p>
              <h2 className="mt-1 text-2xl font-black">When is the finish line?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Pick a window short enough to create urgency and long enough to gather real proof.</p>
            </div>
            <label>Start date<small className="font-normal text-muted-foreground">The day your team starts logging proof.</small><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["7", "14", "30", "custom"].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDuration(days)}
                  className={`min-h-14 rounded-xl border font-black capitalize transition ${duration === days ? "border-primary bg-primary/15 text-violet-100 shadow-[0_0_22px_rgba(124,58,237,.18)]" : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
                >
                  {days === "custom" ? "Custom" : `${days} days`}
                </button>
              ))}
            </div>
            {duration === "custom" && <label>Custom end date<small className="font-normal text-muted-foreground">Keep the deadline close enough that reviews stay fresh.</small><input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} /></label>}
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm">
              <CalendarDays className="text-amber-300" size={20} />
              <span><strong>{startDate}</strong> to <strong>{endDate}</strong></span>
            </div>
          </div>
        </div>

        <div hidden={step !== 3}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">Step 4</p>
              <h2 className="mt-1 text-2xl font-black">Who is committing with you?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Select the teammates who will do the work, submit proof, and review each other fairly.</p>
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
                    <label>Role <small className="font-normal text-muted-foreground">Optional shorthand for how this person helps.</small><input name={`role_${member.id}`} placeholder="Frontend, design, QA, outreach" /></label>
                    <label>Strengths <small className="font-normal text-muted-foreground">AI uses this to assign realistic work.</small><input name={`strengths_${member.id}`} required placeholder="Next.js, customer interviews, QA" /></label>
                    <label>Growth edges <small className="font-normal text-muted-foreground">This helps avoid unfair assignments.</small><input name={`weaknesses_${member.id}`} placeholder="Visual polish, backend, copywriting" /></label>
                    <label>Availability per day <small className="font-normal text-muted-foreground">Minutes available for this commitment.</small><input name={`availability_${member.id}`} type="number" min={15} max={1440} defaultValue={120} required /></label>
                    <label className="sm:col-span-2">Preferred work <small className="font-normal text-muted-foreground">Examples: development, testing, writing, outreach, design.</small><input name={`work_types_${member.id}`} placeholder="development, testing, writing" /></label>
                    <label className="sm:col-span-2">Notes <small className="font-normal text-muted-foreground">Anything AI should know before drafting assignments.</small><textarea name={`notes_${member.id}`} className="min-h-20" placeholder="I can review after 5pm. Avoid backend tasks unless paired." /></label>
                  </div>
                )}
              </fieldset>
            ))}
            {!selectedMembers.length && <ErrorMessage message="Select at least one project member." />}
          </div>
        </div>

        <div hidden={step !== 4}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">Step 5</p>
              <h2 className="mt-1 text-2xl font-black">What is everyone putting at stake?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">This is a declared commitment, not a payment flow. Use virtual points unless your team wants a label for discussion.</p>
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-4 text-sm font-bold text-amber-200">
              Beginner tip: 30 points is enough to feel real without making the project stressful. No money is collected, escrowed, or distributed.
            </div>
            {selectedMembers.map((member) => (
              <fieldset key={member.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_1.1fr]">
                <legend className="px-2 font-black">{member.name}</legend>
                <label>Pledge amount<small className="font-normal text-muted-foreground">Example: 30 virtual points.</small><input name={`pledge_${member.id}`} type="number" min={0} defaultValue={30} required /></label>
                <label>Unit<small className="font-normal text-muted-foreground">Use points for the simplest MVP experience.</small><select name={`currency_${member.id}`} defaultValue="POINTS"><option value="POINTS">Virtual points</option><option value="EUR_DECLARED">EUR declared label</option></select></label>
              </fieldset>
            ))}
          </div>
        </div>

        <div hidden={step !== 5}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">Step 6</p>
              <h2 className="mt-1 text-2xl font-black">Let AI create your action plan</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">The AI plan is a draft. You can edit task names, owners, deadlines, and evidence requirements before starting.</p>
            </div>
            <HelpCard title="Proof of work examples" tone="cyan">
              <EvidenceExamples />
            </HelpCard>
            <div className="grid gap-3">
              {expectedPlan.map((task, index) => {
                const owner = selectedMembers[index % Math.max(1, selectedMembers.length)];
                return (
                  <Card key={task.title} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[.12em] text-cyan-300">Phase {index + 1}</p>
                        <h3 className="font-black">{task.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Owner: {owner?.name || "Selected teammate"} - Due {addDays(startDate, task.daysFromStart)} - assigned from strengths and availability</p>
                      </div>
                      <StatusBadge status="todo" />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3"><strong>Acceptance</strong><p className="mt-1 text-muted-foreground">{task.criteria}</p></div>
                      <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3"><strong>Expected evidence</strong><p className="mt-1 text-muted-foreground">{task.evidence}</p></div>
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
              <p className="text-xs font-black uppercase tracking-wider text-primary">Step 7</p>
              <h2 className="mt-1 text-2xl font-black">Review everything before starting</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">This creates a draft project. Nothing starts until you generate and approve the AI plan on the project page.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-4"><Users className="text-primary" /><p className="mt-3 text-2xl font-black">{selectedMembers.length}</p><p className="text-sm text-muted-foreground">Members</p></Card>
              <Card className="p-4"><ShieldCheck className="text-amber-300" /><p className="mt-3 text-2xl font-black">{selectedMembers.length * 30}</p><p className="text-sm text-muted-foreground">Default points</p></Card>
              <Card className="p-4"><Brain className="text-cyan-300" /><p className="mt-3 text-2xl font-black">{criteria.filter(Boolean).length}</p><p className="text-sm text-muted-foreground">Criteria</p></Card>
            </div>
            <div className="rounded-xl border border-border bg-secondary p-4">
              <h3 className="font-black">Accountability flow</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Project {"->"} Commitment {"->"} AI Plan {"->"} Daily Evidence {"->"} Peer Approval {"->"} AI Final Report {"->"} Human Confirmation</p>
            </div>
            <NextActionCard
              title="Ready to create the draft"
              copy="Next, generate the AI plan, edit anything that feels off, then start the project when the team is aligned."
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-16 mt-4 flex gap-3 rounded-2xl border border-border bg-background/90 p-3 backdrop-blur md:bottom-0">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={18} /> Back</Button>
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            type="button"
            disabled={(step === 3 || step === 4 || step === 5 || step === 6) && !selectedMembers.length}
            onClick={() => setStep((value) => value + 1)}
          >
            Continue <ArrowRight size={18} />
          </Button>
        ) : (
          <Button className="flex-1" type="submit" disabled={!selectedMembers.length}>Create draft commitment <Check size={18} /></Button>
        )}
      </div>
    </form>
  );
}
