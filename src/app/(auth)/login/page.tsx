import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { login } from "@/app/(auth)/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";
import { T } from "@/i18n/useTranslation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  return (
    <Card className="p-6 sm:p-8">
      <div className="inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
        <LockKeyhole size={22} />
      </div>
      <h1 className="mt-5 text-3xl font-black tracking-[-.035em]"><T k="auth.welcomeBack" /></h1>
      <p className="mt-2 leading-6 text-muted-foreground"><T k="auth.loginCopy" /></p>
      <form action={login} className="mt-7 grid gap-4">
        <ErrorMessage message={params.error} />
        {params.notice && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/12 p-3 text-sm font-bold text-emerald-200">{params.notice}</div>}
        <label><T k="common.email" /><input name="email" type="email" required autoComplete="email" /></label>
        <label><T k="common.password" /><input name="password" type="password" minLength={6} required autoComplete="current-password" /></label>
        <Button size="lg" type="submit"><T k="common.logIn" /> <ArrowRight size={18} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <T k="auth.newHere" /> <Link className="font-black text-primary" href="/register"><T k="auth.createAccountLink" /></Link>
      </p>
    </Card>
  );
}
