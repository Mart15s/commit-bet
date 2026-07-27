"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function DeleteEvidenceForm({
  evidenceId,
  deleteAction,
}: {
  evidenceId: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={deleteAction} className="mt-3 rounded-xl border border-red-300/20 bg-red-400/5 p-3">
      <input type="hidden" name="evidence_id" value={evidenceId} />
      <label className="flex min-h-11 items-center gap-2 text-xs font-bold">
        <input
          checked={confirmed}
          name="confirm_delete"
          onChange={(event) => setConfirmed(event.target.checked)}
          type="checkbox"
          value="yes"
        />
        I understand this permanently removes the evidence record and stored file.
      </label>
      <Button disabled={!confirmed} size="sm" type="submit" variant="danger">
        Delete evidence
      </Button>
    </form>
  );
}
