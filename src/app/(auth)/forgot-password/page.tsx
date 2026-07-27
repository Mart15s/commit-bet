import { ForgotPasswordForm } from "@/components/password-forms";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  return <ForgotPasswordForm error={params.error} notice={params.notice} />;
}
