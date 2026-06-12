"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { createProject } from "@/app/(protected)/app/projects/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";

type Member = { id: string; name: string; email: string };
type Team = { id: string; name: string; members: Member[] };

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
  const [duration, setDuration] = useState("7");
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const currentTeam = useMemo(() => teams.find((team) => team.id === teamId), [teams, teamId]);
  const selectedMembers = useMemo(
    () => currentTeam?.members.filter((member) => selectedMemberIds.includes(member.id)) ?? [],
    [currentTeam, selectedMemberIds],
  );
  const endDate = useMemo(() => {
    const date = new Date(`${startDate}T00:00:00`);
    date.setDate(date.getDate() + Number(duration) - 1);
    return date.toISOString().slice(0, 10);
  }, [duration, startDate]);
  const steps = ["Basics", "Success", "Duration", "Members", "Profiles", "Pledges"];

  return (
    <form action={createProject} noValidate>
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="start_date" value={startDate} />
      <input type="hidden" name="end_date" value={endDate} />
      <div className="mb-6 flex gap-1.5">
        {steps.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--brand)]" : "bg-[#dfe4dd]"}`} />
            <span className="mt-1 hidden text-[10px] font-bold sm:block">{label}</span>
          </div>
        ))}
      </div>
      <ErrorMessage message={error} />

      <Card className="mt-4 min-h-[28rem]">
        <div hidden={step !== 0}>
          <div className="grid gap-4">
            <div><p className="text-xs font-black uppercase tracking-wider text-[var(--brand)]">Step 1 of 6</p><h2 className="mt-1 text-2xl font-black">Project basics</h2></div>
            <label>Team<select value={teamId} onChange={(event) => {
              const nextTeamId = event.target.value;
              setTeamId(nextTeamId);
              setSelectedMemberIds(teams.find((team) => team.id === nextTeamId)?.members.map((member) => member.id) ?? []);
            }}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label>Title<input name="title" required placeholder="Build a landing page and waitlist" /></label>
            <label>Description<textarea name="description" required placeholder="What are you building and why now?" /></label>
            <label>Main goal<textarea name="goal" required placeholder="Ship a working page that collects waitlist signups." /></label>
          </div>
        </div>
        <div hidden={step !== 1}>
          <div className="grid gap-4">
            <div><p className="text-xs font-black uppercase tracking-wider text-[var(--brand)]">Step 2 of 6</p><h2 className="mt-1 text-2xl font-black">Define success</h2></div>
            <p className="text-sm text-[var(--muted)]">Use one clear, verifiable criterion per line.</p>
            <label>Success criteria<textarea name="success_criteria" required className="min-h-64" defaultValue={"Landing page is online\nWaitlist form works\nSignup data is stored\nThree value proposition sections are visible\nFinal demo video is recorded"} /></label>
          </div>
        </div>
        <div hidden={step !== 2}>
          <div className="grid gap-5">
            <div><p className="text-xs font-black uppercase tracking-wider text-[var(--brand)]">Step 3 of 6</p><h2 className="mt-1 text-2xl font-black">Choose the sprint</h2></div>
            <label>Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <div className="grid grid-cols-3 gap-2">
              {["7", "14", "30"].map((days) => <button key={days} type="button" onClick={() => setDuration(days)} className={`min-h-14 rounded-xl border font-black ${duration === days ? "border-[var(--brand)] bg-[#e6f0e8] text-[var(--brand)]" : "border-[var(--line)] bg-white"}`}>{days} days</button>)}
            </div>
            <div className="rounded-xl bg-[#f4f6f2] p-4 text-sm"><strong>{startDate}</strong> to <strong>{endDate}</strong></div>
          </div>
        </div>
        <div hidden={step !== 3}>
          <div className="grid gap-4">
            <div><p className="text-xs font-black uppercase tracking-wider text-[var(--brand)]">Step 4 of 6</p><h2 className="mt-1 text-2xl font-black">Project members</h2></div>
            <p className="text-sm text-[var(--muted)]">Selected members receive profiles, pledges, and AI task assignments.</p>
            {currentTeam?.members.map((member) => (
              <label key={member.id} className="flex cursor-pointer grid-cols-none items-center gap-3 rounded-xl border border-[var(--line)] p-4">
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
                <span><strong className="block">{member.name}</strong><small className="font-normal text-[var(--muted)]">{member.email}</small></span>
              </label>
            ))}
            {!selectedMembers.length && <ErrorMessage message="Select at least one project member." />}
          </div>
        </div>
        <div hidden={step !== 4}>
          <div className="grid gap-5">
            <div><p className="text-xs font-black uppercase tracking-wider text-[var(--brand)]">Step 5 of 6</p><h2 className="mt-1 text-2xl font-black">Member profiles</h2></div>
            {selectedMembers.map((member) => (
              <fieldset key={member.id} className="grid gap-3 rounded-2xl border border-[var(--line)] p-4">
                <legend className="px-2 font-black">{member.name}</legend>
                <label>Strengths <input name={`strengths_${member.id}`} required placeholder="programming, backend, AI integrations" /></label>
                <label>Weaknesses <input name={`weaknesses_${member.id}`} placeholder="visual design, outreach" /></label>
                <label>Availability per day <input name={`availability_${member.id}`} type="number" min={15} max={1440} defaultValue={120} required /></label>
                <label>Preferred work <input name={`work_types_${member.id}`} placeholder="development, testing" /></label>
                <label>Notes <textarea name={`notes_${member.id}`} className="min-h-20" /></label>
              </fieldset>
            ))}
          </div>
        </div>
        <div hidden={step !== 5}>
          <div className="grid gap-5">
            <div><p className="text-xs font-black uppercase tracking-wider text-[var(--brand)]">Step 6 of 6</p><h2 className="mt-1 text-2xl font-black">Virtual pledge</h2></div>
            <div className="rounded-xl bg-[#fff6d9] p-4 text-sm font-bold text-[#67521c]">This is a declared commitment only. CommitBet does not collect or transfer money.</div>
            {selectedMembers.map((member) => (
              <fieldset key={member.id} className="grid grid-cols-[1fr_1.2fr] gap-3 rounded-2xl border border-[var(--line)] p-4">
                <legend className="px-2 font-black">{member.name}</legend>
                <label>Amount<input name={`pledge_${member.id}`} type="number" min={0} defaultValue={20} required /></label>
                <label>Unit<select name={`currency_${member.id}`} defaultValue="POINTS"><option value="POINTS">Points</option><option value="EUR_DECLARED">EUR declared</option></select></label>
              </fieldset>
            ))}
          </div>
        </div>
      </Card>

      <div className="sticky bottom-16 mt-4 flex gap-3 rounded-2xl border border-[var(--line)] bg-[#f6f7f2]/95 p-3 backdrop-blur md:bottom-0">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={18} /> Back</Button>
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            type="button"
            disabled={step === 3 && !selectedMembers.length}
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
