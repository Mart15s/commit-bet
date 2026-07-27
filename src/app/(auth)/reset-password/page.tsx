import { ResetPasswordForm } from "@/components/password-forms";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordForm error={params.error} />;
}
