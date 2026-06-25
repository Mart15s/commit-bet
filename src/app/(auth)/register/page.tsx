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
      <div className="inline-flex rounded-xl bg-[#eef3ec] p-3 text-[var(--brand)]">
        <UserPlus size={22} />
      </div>
      <h1 className="mt-5 text-3xl font-black tracking-[-.035em]">Create your account</h1>
      <p className="mt-2 leading-6 text-[var(--muted)]">Set up your profile, then create or join a small team commitment sprint.</p>
      <form action={register} className="mt-7 grid gap-4">
        <ErrorMessage message={params.error} />
        <label>Name<input name="name" required minLength={2} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <div className="rounded-xl bg-[#fff6d9] p-3 text-sm font-bold text-[#735813]">
          Onboarding starts with your team, project goal, success criteria, and virtual pledge points. No real money is handled.
        </div>
        <Button size="lg" type="submit">Create account <ArrowRight size={18} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already registered? <Link className="font-black text-[var(--brand)]" href="/login">Log in</Link>
      </p>
    </Card>
  );
}
