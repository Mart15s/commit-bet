"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import {
  requestPasswordReset,
  updatePassword,
} from "@/app/(auth)/actions";
import { PendingButton } from "@/components/pending-button";
import { Card, ErrorMessage } from "@/components/ui";

export function ForgotPasswordForm({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  return (
    <Card className="p-6 sm:p-8">
      <KeyRound className="text-primary" />
      <h1 className="mt-5 text-3xl font-black">Reset your password</h1>
      <p className="mt-2 text-muted-foreground">
        We will email a time-limited recovery link if the account exists.
      </p>
      <form action={requestPasswordReset} className="mt-7 grid gap-4">
        <ErrorMessage message={error} />
        {notice && <p aria-live="polite" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm">{notice}</p>}
        <label>Email<input autoComplete="email" name="email" required type="email" /></label>
        <PendingButton idleLabel="Send recovery link" pendingLabel="Sending…" />
      </form>
      <Link className="mt-6 inline-block text-sm font-black text-primary" href="/login">Back to login</Link>
    </Card>
  );
}

export function ResetPasswordForm({ error }: { error?: string }) {
  return (
    <Card className="p-6 sm:p-8">
      <KeyRound className="text-primary" />
      <h1 className="mt-5 text-3xl font-black">Choose a new password</h1>
      <p className="mt-2 text-muted-foreground">Use at least eight characters.</p>
      <form action={updatePassword} className="mt-7 grid gap-4">
        <ErrorMessage message={error} />
        <label>New password<input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
        <label>Confirm password<input autoComplete="new-password" minLength={8} name="password_confirmation" required type="password" /></label>
        <PendingButton idleLabel="Update password" pendingLabel="Updating…" />
      </form>
    </Card>
  );
}
