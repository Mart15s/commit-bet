"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isLanguage, type Language } from "@/lib/i18n";

export async function updateProfile(
  _previousState: { ok: boolean; message: string },
  formData: FormData,
) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  if (!name) return { ok: false, message: "profile.nameRequired" };

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: "profile.error" };

  revalidatePath("/app/profile");
  revalidatePath("/app");
  return { ok: true, message: "profile.saved" };
}

export async function updatePreferredLanguage(language: Language | string) {
  if (!isLanguage(language)) return { ok: false };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: language })
    .eq("id", user.id);

  if (error) return { ok: false };

  revalidatePath("/app/profile");
  revalidatePath("/app");
  return { ok: true };
}
