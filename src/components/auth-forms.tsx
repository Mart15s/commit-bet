"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole, UserPlus } from "lucide-react";
import { login, register } from "@/app/(auth)/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";
import { useI18n } from "@/components/language-provider";

function AuthSubmit({ mode }: { mode: "login" | "register" }) {
  const { pending } = useFormStatus();
  const { t, language } = useI18n();
  const label = pending
    ? language === "lt"
      ? mode === "login"
        ? "Jungiamasi..."
        : "Kuriama paskyra..."
      : mode === "login"
        ? "Signing in..."
        : "Creating account..."
    : t(mode === "login" ? "auth.loginButton" : "auth.createAccountButton");
  return (
    <Button size="lg" type="submit" disabled={pending} aria-busy={pending}>
      <span role="status" aria-live="polite">{label}</span>
      <ArrowRight size={18} aria-hidden="true" />
    </Button>
  );
}

export function LoginForm({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  const { t } = useI18n();

  return (
    <Card className="p-6 sm:p-8">
      <div className="inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
        <LockKeyhole size={22} />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-[-.035em]">
        {t("auth.loginTitle")}
      </h1>
      <p className="mt-2 leading-6 text-muted-foreground">
        {t("auth.loginCopy")}
      </p>
      <form action={login} className="mt-7 grid gap-4">
        <ErrorMessage message={error} />
        {notice && (
          <div role="status" aria-live="polite" className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground">
            {t(notice)}
          </div>
        )}
        <label>
          {t("auth.email")}
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          {t("auth.password")}
          <input
            name="password"
            type="password"
            minLength={6}
            required
            autoComplete="current-password"
          />
        </label>
        <AuthSubmit mode="login" />
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.newHere")}{" "}
        <Link className="font-bold text-primary" href="/register">
          {t("auth.createAccountLink")}
        </Link>
      </p>
    </Card>
  );
}

export function RegisterForm({ error }: { error?: string }) {
  const { t } = useI18n();

  return (
    <Card className="p-6 sm:p-8">
      <div className="inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
        <UserPlus size={22} />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-[-.035em]">
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-2 leading-6 text-muted-foreground">
        {t("auth.registerCopy")}
      </p>
      <form action={register} className="mt-7 grid gap-4">
        <ErrorMessage message={error} />
        <label>
          {t("auth.name")}
          <input name="name" required minLength={2} autoComplete="name" />
        </label>
        <label>
          {t("auth.email")}
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          {t("auth.password")}
          <input
            name="password"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
          />
        </label>
        <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          {t("auth.onboardingNote")}
        </div>
        <AuthSubmit mode="register" />
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.alreadyRegistered")}{" "}
        <Link className="font-bold text-primary" href="/login">
          {t("auth.loginButton")}
        </Link>
      </p>
    </Card>
  );
}
