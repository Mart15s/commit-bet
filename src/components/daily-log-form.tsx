"use client";

import { useMemo, useState } from "react";
import { Clock3, FileUp, Link2, ListChecks, Send, Sparkles } from "lucide-react";
import { saveDailyLog } from "@/app/(protected)/app/logs/actions";
import { Button, Card, ErrorMessage, StatusBadge } from "@/components/ui";

type Project = { id: string; title: string; tasks: Array<{ id: string; title: string; status: string }> };

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
      <Card className="border-[#d8e2d9] bg-[#fbfcf8]">
        <div className="flex gap-3">
          <div className="rounded-xl bg-[#eef3ec] p-3 text-[var(--brand)]"><Sparkles size={20} /></div>
          <div>
            <h2 className="text-xl font-black">Log the day in under 10 seconds.</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Say what changed, connect tasks, attach proof, and name the next step.</p>
          </div>
        </div>
      </Card>

      <Card className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
          <label>Project<select name="project_id" value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label>Date<input name="log_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        </div>

        <label>
          What did you complete today?
          <textarea name="summary" required className="min-h-28" placeholder="Example: Finished the evidence submission UI and attached the first mobile screenshots." />
        </label>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-black"><ListChecks size={17} className="text-[var(--brand)]" /> Related tasks</div>
          <div className="grid gap-2">
            {openTasks.map((task) => (
              <label key={task.id} className="flex cursor-pointer grid-cols-none items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3">
                <input className="size-5 w-auto" type="checkbox" name="task_id" value={task.id} />
                <span className="min-w-0 flex-1"><strong className="block truncate">{task.title}</strong></span>
                <StatusBadge status={task.status} />
              </label>
            ))}
            {!openTasks.length && <div className="rounded-xl bg-[#f4f6f2] p-4 text-sm text-[var(--muted)]">No open tasks for this project.</div>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="inline-flex items-center gap-2"><Clock3 size={16} /> Time spent</span><input name="time_spent_minutes" type="number" min={0} max={1440} defaultValue={60} required /></label>
          <label><span className="inline-flex items-center gap-2"><Link2 size={16} /> Evidence link</span><input name="evidence_link" type="url" placeholder="https://github.com/... or demo link" /></label>
        </div>

        <label><span className="inline-flex items-center gap-2"><FileUp size={16} /> Evidence upload placeholder</span><input type="file" disabled /><small className="font-normal text-[var(--muted)]">Daily-log uploads are UI-only for now. Task evidence upload is available from task detail.</small></label>
        <label>Blockers<textarea name="blockers" className="min-h-20" placeholder="Leave blank if none" /></label>
        <label>Next steps<textarea name="next_steps" className="min-h-20" required placeholder="What will you move forward next?" /></label>
      </Card>
      <Button className="sticky bottom-16 w-full md:bottom-3" size="lg" type="submit">Submit daily log <Send size={18} /></Button>
    </form>
  );
}
