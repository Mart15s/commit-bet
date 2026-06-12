"use client";

import { useMemo, useState } from "react";
import { saveDailyLog } from "@/app/(protected)/app/logs/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";

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
  return (
    <form action={saveDailyLog} className="grid gap-4">
      <ErrorMessage message={error} />
      <Card className="grid gap-4">
        <label>Project<select name="project_id" value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Date<input name="log_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <div>
          <p className="mb-2 text-sm font-black">Related tasks</p>
          <div className="grid gap-2">
            {project?.tasks.filter((task) => task.status !== "approved").map((task) => (
              <label key={task.id} className="flex grid-cols-none items-center gap-3 rounded-xl border border-[var(--line)] p-3">
                <input className="size-5 w-auto" type="checkbox" name="task_id" value={task.id} />
                <span>{task.title}</span>
              </label>
            ))}
          </div>
        </div>
        <label>What did you finish?<textarea name="summary" required placeholder="One to three clear sentences..." /></label>
        <label>Minutes spent<input name="time_spent_minutes" type="number" min={0} max={1440} defaultValue={60} required /></label>
        <label>Blockers<textarea name="blockers" className="min-h-20" placeholder="Leave blank if none" /></label>
        <label>Next step<textarea name="next_steps" className="min-h-20" required placeholder="What will you do next?" /></label>
      </Card>
      <Button className="sticky bottom-16 w-full md:bottom-3" size="lg" type="submit">Save daily log</Button>
    </form>
  );
}

