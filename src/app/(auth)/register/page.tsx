import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { register } from "@/app/(auth)/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";
import { T } from "@/i18n/useTranslation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <Card className="p-6 sm:p-8">
      <div className="inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
        <UserPlus size={22} />
      </div>
      <h1 className="mt-5 text-3xl font-black tracking-[-.035em]"><T k="auth.createTitle" /></h1>
      <p className="mt-2 leading-6 text-muted-foreground"><T k="auth.createCopy" /></p>
      <form action={register} className="mt-7 grid gap-4">
        <ErrorMessage message={params.error} />
        <label><T k="common.name" /><input name="name" required minLength={2} autoComplete="name" /></label>
        <label><T k="common.email" /><input name="email" type="email" required autoComplete="email" /></label>
        <label><T k="common.password" /><input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-3 text-sm font-bold text-amber-200">
          <T k="auth.onboardingNote" />
        </div>
        <Button size="lg" type="submit"><T k="common.createAccount" /> <ArrowRight size={18} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <T k="auth.alreadyRegistered" /> <Link className="font-black text-primary" href="/login"><T k="common.logIn" /></Link>
      </p>
    </Card>
  );
}
