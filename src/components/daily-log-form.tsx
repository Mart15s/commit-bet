"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Clock3, FileUp, Link2, ListChecks, Loader2, Send, Sparkles } from "lucide-react";
import { saveDailyLog } from "@/app/(protected)/app/logs/actions";
import { AIEnhanceButton } from "@/components/ai-controls";
import { Button, Card, EmptyState, ErrorMessage, EvidenceExamples, HelpCard, StatusBadge } from "@/components/ui";

type Project = { id: string; title: string; tasks: Array<{ id: string; title: string; status: string }> };

function DailyLogSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="sticky bottom-16 w-full shadow-[0_-14px_36px_rgba(2,6,23,.35)] md:bottom-3" size="lg" type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
      {pending ? "Logging progress..." : "Log today's progress"}
    </Button>
  );
}

export function DailyLogForm({
  projects,
  initialProject,
  error,
}: {
  projects: Project[];
  initialProject?: string;
  error?: string;
}) {
  const [projectId, setProjectId] = useState(initialProject || projects[0]?.id || "");
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId, projects]);
  const openTasks = project?.tasks.filter((task) => task.status !== "approved") ?? [];

  return (
    <form action={saveDailyLog} className="grid gap-4">
      <ErrorMessage message={error} />
      <Card className="border-cyan-300/25 bg-cyan-400/10">
        <div className="flex gap-3">
          <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-3 text-cyan-300"><Sparkles size={20} /></div>
          <div>
            <h2 className="text-xl font-black">Log today in under 2 minutes.</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">A short daily check-in keeps the team aligned and gives reviewers enough proof to help.</p>
          </div>
        </div>
      </Card>

      <Card className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
          <label>Project<select name="project_id" value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label>Date<input name="log_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        </div>

        <label>
          <span>1. What did you work on?</span>
          <small className="font-normal text-muted-foreground">One plain-language update is enough.</small>
          <textarea name="summary" required className="min-h-28" placeholder="Example: Finished the evidence submission UI and attached the first mobile screenshots." />
        </label>
        <AIEnhanceButton targetName="summary" context="daily_log" />

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-black"><ListChecks size={17} className="text-primary" /> 2. Which task does this support?</div>
          <p className="mb-3 text-sm text-muted-foreground">Choose every task that your work moved forward. It is okay to pick none if today was planning or unblock work.</p>
          <div className="grid gap-2">
            {openTasks.map((task) => (
              <label key={task.id} className="flex cursor-pointer grid-cols-none items-center gap-3 rounded-xl border border-border bg-secondary p-3 hover:border-primary/50">
                <input className="size-5 w-auto" type="checkbox" name="task_id" value={task.id} />
                <span className="min-w-0 flex-1"><strong className="block truncate">{task.title}</strong></span>
                <StatusBadge status={task.status} />
              </label>
            ))}
            {!openTasks.length && (
              <EmptyState
                title="No tasks yet"
                copy="Tasks appear here after the AI plan is generated and the project is started."
                tip="Next: ask the project owner to review the AI draft and start the project."
                className="py-6"
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="inline-flex items-center gap-2"><Clock3 size={16} /> Time spent</span><small className="font-normal text-muted-foreground">Approximate minutes are fine.</small><input name="time_spent_minutes" type="number" min={0} max={1440} defaultValue={60} required /></label>
          <label><span className="inline-flex items-center gap-2"><Link2 size={16} /> 3. Add proof link</span><small className="font-normal text-muted-foreground">Paste a commit, screenshot, demo, Figma, doc, or video link.</small><input name="evidence_link" type="url" placeholder="https://github.com/... or demo link" /></label>
        </div>

        <HelpCard title="Good proof of work looks like this" tone="cyan">
          <EvidenceExamples />
        </HelpCard>
        <label><span className="inline-flex items-center gap-2 text-cyan-200"><FileUp size={16} /> Proof upload</span><input type="file" disabled /><small className="font-normal text-muted-foreground">Daily-log uploads are not stored yet. For official task proof, open the task detail and attach evidence there.</small></label>
        <label>4. Any blockers?<small className="font-normal text-muted-foreground">Leave blank if nothing is stuck.</small><textarea name="blockers" className="min-h-20" placeholder="Example: Waiting on API credentials before I can test the live flow." /></label>
        <label>5. What is next?<small className="font-normal text-muted-foreground">Name the next small move so tomorrow is easy to start.</small><textarea name="next_steps" className="min-h-20" required placeholder="Example: Add task evidence from the demo link and ask Sam to review it." /></label>
      </Card>
      <DailyLogSubmitButton />
    </form>
  );
}
