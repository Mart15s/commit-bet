import { RegisterForm } from "@/components/auth-forms";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <RegisterForm error={params.error} />;
}
