"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ name: String(formData.get("name") ?? "") }).eq("id", user.id);
  revalidatePath("/app/settings");
}

