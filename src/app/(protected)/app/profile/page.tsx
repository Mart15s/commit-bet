import { ProfilePage } from "@/components/profile-page";
import { requireUser } from "@/lib/auth";

export default async function ProfileRoute() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <ProfilePage
      profile={{
        email: profile?.email ?? user.email ?? "",
        name: profile?.name ?? user.user_metadata?.name ?? "",
        avatar_url: profile?.avatar_url ?? null,
      }}
    />
  );
}
