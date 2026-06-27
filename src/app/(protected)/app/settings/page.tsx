import { logout } from "@/app/(auth)/actions";
import { updateProfile } from "@/app/(protected)/app/settings/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button, Card, PageHeader } from "@/components/ui";
import { T } from "@/i18n/useTranslation";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (
    <>
      <PageHeader title={<T k="settings.title" />} description={<T k="settings.description" />} />
      <Card className="grid max-w-xl gap-6">
        <div>
          <h2 className="text-lg font-black"><T k="language.settingsTitle" /></h2>
          <p className="mt-1 text-sm text-muted-foreground"><T k="language.settingsDescription" /></p>
          <LanguageSwitcher className="mt-4 max-w-xs" mode="select" />
        </div>
        <form action={updateProfile} className="grid gap-4">
          <label><T k="common.name" /><input name="name" defaultValue={profile?.name} required /></label>
          <label><T k="common.email" /><input value={profile?.email} disabled /></label>
          <Button type="submit"><T k="settings.saveProfile" /></Button>
        </form>
        <form className="border-t border-border pt-6" action={logout}><Button variant="secondary" type="submit"><T k="nav.logout" /></Button></form>
      </Card>
    </>
  );
}
