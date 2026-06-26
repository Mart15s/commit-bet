import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { register } from "@/app/(auth)/actions";
import { Button, Card, ErrorMessage } from "@/components/ui";

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
      <h1 className="mt-5 text-3xl font-black tracking-[-.035em]">Create your account</h1>
      <p className="mt-2 leading-6 text-muted-foreground">Set up your profile, then create or join a small team commitment sprint.</p>
      <form action={register} className="mt-7 grid gap-4">
        <ErrorMessage message={params.error} />
        <label>Name<input name="name" required minLength={2} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <div className="rounded-xl border border-amber-300/30 bg-amber-400/12 p-3 text-sm font-bold text-amber-200">
          Onboarding starts with your team, project goal, success criteria, and virtual pledge points. No real money is handled.
        </div>
        <Button size="lg" type="submit">Create account <ArrowRight size={18} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered? <Link className="font-black text-primary" href="/login">Log in</Link>
      </p>
    </Card>
  );
}
