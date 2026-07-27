"use client";

import { useActionState, useState } from "react";
import { Loader2, Users } from "lucide-react";
import {
  confirmFinalDecision,
  type FinalDecisionActionState,
} from "@/app/(protected)/app/projects/[id]/final/actions";
import { Button, ErrorMessage } from "@/components/ui";

type FinalDecisionMember = {
  userId: string;
  name: string;
  recommendedReturnPercentage: number;
  recommendationReason: string;
};

const initialState: FinalDecisionActionState = { status: "idle" };

export function FinalDecisionForm({
  projectId,
  finalReportId,
  idempotencyKey,
  members,
}: {
  projectId: string;
  finalReportId: string;
  idempotencyKey: string;
  members: FinalDecisionMember[];
}) {
  const [actionState, formAction, pending] = useActionState(
    confirmFinalDecision,
    initialState,
  );
  const [returnPercentages, setReturnPercentages] = useState(
    Object.fromEntries(
      members.map((member) => [
        member.userId,
        String(member.recommendedReturnPercentage),
      ]),
    ),
  );
  const [confirmationNote, setConfirmationNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={formAction} className="mt-5 grid gap-4">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="final_report_id" value={finalReportId} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      {actionState.status === "error" && (
        <ErrorMessage message={actionState.message} />
      )}
      {actionState.status === "success" && (
        <p
          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm font-bold text-emerald-100"
          role="status"
        >
          {actionState.message}
        </p>
      )}
      {members.map((member) => (
        <label key={member.userId}>
          <input type="hidden" name="member_id" value={member.userId} />
          {member.name}: virtual pledge return percentage
          <input
            name="return_percentage"
            type="number"
            min={0}
            max={100}
            step="any"
            value={returnPercentages[member.userId]}
            onChange={(event) => {
              setReturnPercentages((current) => ({
                ...current,
                [member.userId]: event.target.value,
              }));
            }}
            disabled={pending}
            required
          />
          <small className="font-normal text-muted-foreground">
            AI recommendation: {member.recommendedReturnPercentage}% —{" "}
            {member.recommendationReason}
          </small>
        </label>
      ))}
      <label>
        Optional human confirmation note
        <textarea
          name="confirmation_note"
          maxLength={2000}
          value={confirmationNote}
          onChange={(event) => setConfirmationNote(event.target.value)}
          disabled={pending}
          placeholder="Record why the team chose this final virtual-pledge outcome."
          className="min-h-20"
        />
      </label>
      <label className="flex grid-cols-none items-start gap-3 rounded-xl border border-amber-300/30 bg-background/45 p-4">
        <input
          className="mt-1 size-5 w-auto"
          type="checkbox"
          name="human_confirmation"
          value="yes"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={pending}
          required
        />
        <span>
          I understand this is my team&apos;s manual virtual-pledge decision.
          No funds are transferred.
        </span>
      </label>
      <Button type="submit" size="lg" disabled={pending}>
        {pending
          ? <Loader2 className="animate-spin" size={18} />
          : <Users size={18} />}
        {pending
          ? "Finalizing project..."
          : actionState.status === "error"
            ? "Retry final confirmation"
            : "Confirm final outcome"}
      </Button>
    </form>
  );
}
