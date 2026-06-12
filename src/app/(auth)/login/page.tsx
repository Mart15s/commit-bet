import Link from "next/link";
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
      <h1 className="text-3xl font-black">Welcome back</h1>
      <p className="mt-2 text-[var(--muted)]">Continue your team commitment sprint.</p>
      <form action={login} className="mt-7 grid gap-4">
        <ErrorMessage message={params.error} />
        {params.notice && <div className="rounded-xl bg-[#e4f4e7] p-3 text-sm font-bold text-[#28603a]">{params.notice}</div>}
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" minLength={6} required autoComplete="current-password" /></label>
        <Button size="lg" type="submit">Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        New here? <Link className="font-black text-[var(--brand)]" href="/register">Create an account</Link>
      </p>
    </Card>
  );
}

