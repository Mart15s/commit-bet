import { logout } from "@/app/(auth)/actions";
import { updateProfile } from "@/app/(protected)/app/settings/actions";
import { Button, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (
    <>
      <PageHeader title="Profile settings" description="The name teammates see across projects and reviews." />
      <Card className="max-w-xl">
        <form action={updateProfile} className="grid gap-4">
          <label>Name<input name="name" defaultValue={profile?.name} required /></label>
          <label>Email<input value={profile?.email} disabled /></label>
          <Button type="submit">Save profile</Button>
        </form>
        <form action={logout} className="mt-6 border-t border-[var(--line)] pt-6"><Button variant="secondary" type="submit">Log out</Button></form>
      </Card>
    </>
  );
}

