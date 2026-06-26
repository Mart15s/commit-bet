"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, CalendarDays, Check, Minus, Plus, ShieldCheck, Users } from "lucide-react";
import { createProject } from "@/app/(protected)/app/projects/actions";
import { Button, Card, ErrorMessage, Progress, StatusBadge } from "@/components/ui";

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
  const steps = ["Basics", "Success", "Sprint", "Team", "Pledge", "AI plan", "Review"];
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
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary">Step {step + 1} of {steps.length}</p>
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
              <p className="text-xs font-black uppercase tracking-wider text-primary">Project basics</p>
              <h2 className="mt-1 text-2xl font-black">What promise is this team making?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">CommitBet works best when the project has a sharp goal, a deadline, and an owner group.</p>
            </div>
            <label>Team<select value={teamId} onChange={(event) => {
              const nextTeamId = event.target.value;
              setTeamId(nextTeamId);
              setSelectedMemberIds(teams.find((team) => team.id === nextTeamId)?.members.map((member) => member.id) ?? []);
            }}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label>Project name<input name="title" required placeholder="Launch the first CommitBet waitlist" /></label>
            <label>Description<textarea name="description" required placeholder="What are you building and why is now the right time?" /></label>
            <label>Main goal<textarea name="goal" required placeholder="Ship a reviewable MVP that turns team promises into evidence-based commitments." /></label>
          </div>
        </div>

        <div hidden={step !== 1}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">Success criteria</p>
              <h2 className="mt-1 text-2xl font-black">Make success measurable.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">One criterion should be independently reviewable from evidence.</p>
            </div>
            <div className="grid gap-3">
              {criteria.map((criterion, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={criterion}
                    onChange={(event) => setCriteria((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    placeholder="Example: Final demo can be opened by a reviewer"
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
            <Button type="button" variant="secondary" onClick={() => setCriteria((items) => [...items, ""])}>
              <Plus size={16} /> Add criterion
            </Button>
          </div>
        </div>

        <div hidden={step !== 2}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">Duration and sprint</p>
              <h2 className="mt-1 text-2xl font-black">Choose the commitment window.</h2>
            </div>
            <label>Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
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
            {duration === "custom" && <label>Custom end date<input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} /></label>}
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm">
              <CalendarDays className="text-amber-300" size={20} />
              <span><strong>{startDate}</strong> to <strong>{endDate}</strong></span>
            </div>
          </div>
        </div>

        <div hidden={step !== 3}>
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">Team members</p>
              <h2 className="mt-1 text-2xl font-black">Assign people before AI plans work.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Roles and strengths help the plan assign realistic ownership.</p>
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
                    <label>Role <input name={`role_${member.id}`} placeholder="Frontend, design, QA, outreach" /></label>
                    <label>Strengths <input name={`strengths_${member.id}`} required placeholder="Next.js, customer interviews, QA" /></label>
                    <label>Weaknesses <input name={`weaknesses_${member.id}`} placeholder="Visual polish, backend, copywriting" /></label>
                    <label>Availability per day <input name={`availability_${member.id}`} type="number" min={15} max={1440} defaultValue={120} required /></label>
                    <label className="sm:col-span-2">Preferred work <input name={`work_types_${member.id}`} placeholder="development, testing, writing" /></label>
                    <label className="sm:col-span-2">Notes <textarea name={`notes_${member.id}`} className="min-h-20" placeholder="Anything AI should know when assigning work?" /></label>
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
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">Commitment</p>
              <h2 className="mt-1 text-2xl font-black">Declare virtual pledge points.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">This MVP records commitment pressure only. It does not collect, escrow, or transfer money.</p>
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-4 text-sm font-bold text-amber-200">
              Use points for the cleanest team ritual. Declared amounts are labels only, not payment instructions.
            </div>
            {selectedMembers.map((member) => (
              <fieldset key={member.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_1.1fr]">
                <legend className="px-2 font-black">{member.name}</legend>
                <label>Amount<input name={`pledge_${member.id}`} type="number" min={0} defaultValue={30} required /></label>
                <label>Unit<select name={`currency_${member.id}`} defaultValue="POINTS"><option value="POINTS">Virtual points</option><option value="EUR_DECLARED">EUR declared label</option></select></label>
              </fieldset>
            ))}
          </div>
        </div>

        <div hidden={step !== 5}>
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">AI-generated plan preview</p>
              <h2 className="mt-1 text-2xl font-black">Preview the shape of the execution plan.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">After creating the draft, the project page can generate and edit the real AI plan from your inputs.</p>
            </div>
            <div className="grid gap-3">
              {expectedPlan.map((task, index) => {
                const owner = selectedMembers[index % Math.max(1, selectedMembers.length)];
                return (
                  <Card key={task.title} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{task.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Owner: {owner?.name || "Selected teammate"} · Due {addDays(startDate, task.daysFromStart)}</p>
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
              <p className="text-xs font-black uppercase tracking-wider text-primary">Review and start</p>
              <h2 className="mt-1 text-2xl font-black">Create the draft commitment.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">You will review and start the AI-generated plan from the project overview before it becomes active.</p>
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
          <Button className="flex-1" type="submit" disabled={!selectedMembers.length}>Create draft <Check size={18} /></Button>
        )}
      </div>
    </form>
  );
}
