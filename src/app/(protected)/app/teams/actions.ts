"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export async function createTeam(formData: FormData) {
  const { supabase } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const { data, error } = await supabase.rpc("create_team", { team_name: name });
  if (error) redirect(`/app/teams?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app");
  redirect(`/app/teams/${data}`);
}

export async function joinTeam(formData: FormData) {
  const { supabase } = await requireUser();
  const code = String(formData.get("code") ?? "");
  const { data, error } = await supabase.rpc("join_team", { code });
  if (error) redirect(`/app/teams?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app");
  redirect(`/app/teams/${data}`);
}

