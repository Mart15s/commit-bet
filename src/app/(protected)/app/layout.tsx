import { AppNav } from "@/components/app-nav";
import { LanguageHydrator } from "@/components/language-provider";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const preferredLanguage = typeof profile?.preferred_language === "string" ? profile.preferred_language : null;

  return (
    <>
      <LanguageHydrator language={preferredLanguage} />
      <AppNav profile={{ name: profile?.name, email: profile?.email ?? user.email, avatar_url: profile?.avatar_url }} />
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:px-8 md:pb-12 md:pt-8">{children}</main>
    </>
  );
}
