"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole, UserPlus } from "lucide-react";
import { login, register } from "@/app/(auth)/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";
import { useI18n } from "@/components/language-provider";

export function LoginForm({ error, notice }: { error?: string; notice?: string }) {
  const { t } = useI18n();

  return (
    <Card className="p-6 sm:p-8">
      <div className="inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
        <LockKeyhole size={22} />
      </div>
      <h1 className="mt-5 text-3xl font-black tracking-[-.035em]">{t("auth.loginTitle")}</h1>
      <p className="mt-2 leading-6 text-muted-foreground">{t("auth.loginCopy")}</p>
      <form action={login} className="mt-7 grid gap-4">
        <ErrorMessage message={error} />
        {notice && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/12 p-3 text-sm font-bold text-emerald-200">{t(notice)}</div>}
        <label>{t("auth.email")}<input name="email" type="email" required autoComplete="email" /></label>
        <label>{t("auth.password")}<input name="password" type="password" minLength={6} required autoComplete="current-password" /></label>
        <Button size="lg" type="submit">{t("auth.loginButton")} <ArrowRight size={18} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.newHere")} <Link className="font-black text-primary" href="/register">{t("auth.createAccountLink")}</Link>
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
      <h1 className="mt-5 text-3xl font-black tracking-[-.035em]">{t("auth.registerTitle")}</h1>
      <p className="mt-2 leading-6 text-muted-foreground">{t("auth.registerCopy")}</p>
      <form action={register} className="mt-7 grid gap-4">
        <ErrorMessage message={error} />
        <label>{t("auth.name")}<input name="name" required minLength={2} autoComplete="name" /></label>
        <label>{t("auth.email")}<input name="email" type="email" required autoComplete="email" /></label>
        <label>{t("auth.password")}<input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-3 text-sm font-bold text-amber-200">
          {t("auth.onboardingNote")}
        </div>
        <Button size="lg" type="submit">{t("auth.createAccountButton")} <ArrowRight size={18} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.alreadyRegistered")} <Link className="font-black text-primary" href="/login">{t("auth.loginButton")}</Link>
      </p>
    </Card>
  );
}
