"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/(protected)/app/profile/actions";
import { Button } from "@/components/ui";

const initialState = { ok: false, message: "" };

export function AccountControls() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <div className="grid gap-3">
      <a
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-black hover:bg-secondary"
        href="/app/profile/export"
      >
        Download my data (JSON)
      </a>
      <form action={formAction} className="grid gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
        <label>
          Type DELETE to remove an eligible account
          <input
            autoComplete="off"
            name="confirmation"
            pattern="DELETE"
            placeholder="DELETE"
            required
          />
        </label>
        <p className="text-xs leading-5 text-muted-foreground">
          For shared accountability history, accounts that still belong to a team cannot be deleted automatically.
          Leave or transfer those teams first, or contact support for a reviewed deletion.
        </p>
        {state.message ? (
          <p className="text-sm font-bold text-red-100" role="status">
            {state.message}
          </p>
        ) : null}
        <Button disabled={pending} type="submit" variant="danger">
          {pending ? "Deleting account…" : "Delete account permanently"}
        </Button>
      </form>
    </div>
  );
}
