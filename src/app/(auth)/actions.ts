"use server";

import { redirect } from "next/navigation";
import {
  getAuthErrorMessage,
  getSiteUrl,
  getSupabaseConfigErrorMessage,
} from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";

function messageUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

export async function login(formData: FormData) {
  const configError = getSupabaseConfigErrorMessage();
  if (configError) redirect(messageUrl("/login", configError));
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(messageUrl("/login", getAuthErrorMessage(error)));
  redirect("/app");
}

export async function register(formData: FormData) {
  const configError = getSupabaseConfigErrorMessage();
  if (configError) redirect(messageUrl("/register", configError));
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${getSiteUrl()}/login?notice=${encodeURIComponent("Email confirmed. You can now log in.")}`,
    },
  });
  if (error) redirect(messageUrl("/register", getAuthErrorMessage(error)));
  if (!data.session) redirect("/login?notice=Check your email to confirm your account.");
  redirect("/app");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
