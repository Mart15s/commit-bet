"use client";

import { useActionState } from "react";
import {
  generatePlan,
  type GeneratePlanActionState,
} from "@/app/(protected)/app/projects/actions";
import { Button } from "@/components/ui";

const initialState: GeneratePlanActionState = {
  status: "idle",
};

export function AIPlanGenerationForm({
  projectId,
  idempotencyKey,
  label,
  className,
}: {
  projectId: string;
  idempotencyKey: string;
  label: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(
    generatePlan,
    initialState,
  );

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="project_id" value={projectId} />
      <input
        type="hidden"
        name="idempotency_key"
        value={idempotencyKey}
      />
      <Button
        aria-disabled={pending}
        className="w-full"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving AI plan…" : label}
      </Button>
      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "mt-2 max-w-xl text-sm font-bold text-red-300"
              : "mt-2 max-w-xl text-sm font-bold text-emerald-300"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
