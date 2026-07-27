"use client";

import { deleteDraftProject } from "@/app/(protected)/app/projects/actions";
import { Button } from "@/components/ui";

export function DeleteProjectForm({ projectId }: { projectId: string }) {
  return (
    <form action={deleteDraftProject} className="grid gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
      <input name="project_id" type="hidden" value={projectId} />
      <label className="flex min-h-11 items-center gap-3">
        <input className="size-5" name="confirm_delete" required type="checkbox" value="yes" />
        <span>Delete this draft and its draft tasks</span>
      </label>
      <p className="text-xs leading-5 text-muted-foreground">
        Only evidence-free draft projects can be deleted. Active and finalized accountability history is preserved.
      </p>
      <Button type="submit" variant="danger">Delete draft project</Button>
    </form>
  );
}
