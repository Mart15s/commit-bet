import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { login } from "@/app/(auth)/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";

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
      <h1 className="mt-5 text-3xl font-black tracking-[-.035em]">Welcome back</h1>
      <p className="mt-2 leading-6 text-muted-foreground">Continue reviewing evidence, daily logs, and pledge outcomes.</p>
      <form action={login} className="mt-7 grid gap-4">
        <ErrorMessage message={params.error} />
        {params.notice && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/12 p-3 text-sm font-bold text-emerald-200">{params.notice}</div>}
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" minLength={6} required autoComplete="current-password" /></label>
        <Button size="lg" type="submit">Log in <ArrowRight size={18} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link className="font-black text-primary" href="/register">Create an account</Link>
      </p>
    </Card>
  );
}
