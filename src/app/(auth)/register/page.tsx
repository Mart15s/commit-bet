import Link from "next/link";
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
      <h1 className="text-3xl font-black">Start finishing</h1>
      <p className="mt-2 text-[var(--muted)]">Create your accountability profile.</p>
      <form action={register} className="mt-7 grid gap-4">
        <ErrorMessage message={params.error} />
        <label>Name<input name="name" required minLength={2} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <Button size="lg" type="submit">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already registered? <Link className="font-black text-[var(--brand)]" href="/login">Log in</Link>
      </p>
    </Card>
  );
}

