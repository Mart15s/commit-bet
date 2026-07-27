"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isLanguage, type Language } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function deleteAccount(
  _previousState: { ok: boolean; message: string },
  formData: FormData,
) {
  if (String(formData.get("confirmation") ?? "") !== "DELETE") {
    return { ok: false, message: "Type DELETE exactly to confirm." };
  }

  const { supabase, user } = await requireUser();
  const { count, error: membershipError } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (membershipError) {
    return { ok: false, message: "Account eligibility could not be checked." };
  }
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message: "This account still belongs to a team. Transfer or leave shared work first, or contact support for a reviewed deletion.",
    };
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    return { ok: false, message: "The account could not be deleted. Contact support if the problem continues." };
  }
  await supabase.auth.signOut();
  redirect("/?notice=Account deleted");
}
