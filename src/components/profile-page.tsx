"use client";

import { useActionState } from "react";
import { Save, UserRound } from "lucide-react";
import { updateProfile } from "@/app/(protected)/app/profile/actions";
import { AccountControls } from "@/components/account-controls";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { Button, Card, PageHeader } from "@/components/ui";
import { useI18n } from "@/components/language-provider";

type Profile = {
  email: string;
  name: string;
  avatar_url: string | null;
};

const initialState = { ok: false, message: "" };

export function ProfilePage({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  return (
    <>
      <PageHeader title={t("profile.title")} description={t("profile.description")} />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/25 bg-primary/10 text-primary">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="size-full object-cover" src={profile.avatar_url} />
              ) : (
                <UserRound size={22} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-[-.02em]">{t("profile.accountTitle")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("profile.accountCopy")}</p>
            </div>
          </div>

          <form action={formAction} className="grid gap-4">
            <label>
              {t("profile.fullName")}
              <input name="name" required minLength={2} defaultValue={profile.name} placeholder={t("profile.fullNamePlaceholder")} autoComplete="name" />
            </label>
            <label>
              {t("profile.email")}
              <input value={profile.email} disabled />
              <small className="text-muted-foreground">{t("profile.emailHelp")}</small>
            </label>
            <label>
              {t("profile.avatarUrl")}
              <input name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ""} placeholder={t("profile.avatarUrlPlaceholder")} />
              <small className="text-muted-foreground">{t("profile.avatarHelp")}</small>
            </label>

            {state.message && (
              <div className={state.ok ? "rounded-xl border border-emerald-400/30 bg-emerald-400/12 p-3 text-sm font-bold text-emerald-200" : "rounded-xl border border-red-400/30 bg-red-500/12 p-3 text-sm font-bold text-red-100"}>
                {t(state.message)}
              </div>
            )}

            <Button className="w-full sm:w-fit" disabled={isPending} size="lg" type="submit">
              <Save size={18} />
              {isPending ? t("profile.saving") : t("profile.save")}
            </Button>
          </form>
        </Card>

        <div className="grid content-start gap-5">
          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-black tracking-[-.02em]">{t("profile.languageTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("profile.languageCopy")}</p>
            <LanguageSwitcher persistToProfile className="mt-5" />
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-black tracking-[-.02em]">{t("profile.sessionTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("profile.sessionCopy")}</p>
            <LogoutButton className="mt-5 w-full sm:w-fit" variant="danger" />
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-black tracking-[-.02em]">Your data</h2>
            <p className="mt-1 mb-5 text-sm leading-6 text-muted-foreground">
              Export your account records or permanently remove an eligible account.
            </p>
            <AccountControls />
          </Card>
        </div>
      </div>
    </>
  );
}
