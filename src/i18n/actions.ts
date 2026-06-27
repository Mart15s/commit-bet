"use server";

import { createClient } from "@/lib/supabase/server";
import { isLocale, type Locale } from "@/i18n/config";

export async function updateLanguagePreference(locale: Locale) {
  if (!isLocale(locale)) return;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("profiles").update({ preferred_language: locale }).eq("id", data.user.id);
  } catch {
    // Anonymous sessions and incomplete local Supabase config still use localStorage.
  }
}
