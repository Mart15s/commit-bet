"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

export function PendingButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button aria-disabled={pending} disabled={pending} size="lg" type="submit">
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
