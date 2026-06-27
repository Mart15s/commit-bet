import { AppNav } from "@/components/app-nav";
import { ProfileLanguageSync } from "@/i18n/profile-language-sync";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("preferred_language").eq("id", user.id).maybeSingle();
  return (
    <>
      <ProfileLanguageSync locale={profile?.preferred_language} />
      <AppNav />
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:px-8 md:pb-12 md:pt-8">{children}</main>
    </>
  );
}
