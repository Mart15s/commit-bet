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
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/app`,
    },
  });
  if (error) redirect(messageUrl("/register", getAuthErrorMessage(error)));
  if (!data.session) redirect("/login?notice=Check your email to confirm your account.");
  redirect("/app");
}

export async function requestPasswordReset(formData: FormData) {
  const configError = getSupabaseConfigErrorMessage();
  if (configError) redirect(messageUrl("/forgot-password", configError));
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    redirect(messageUrl("/forgot-password", "Enter a valid email address."));
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    redirect(messageUrl("/forgot-password", getAuthErrorMessage(error)));
  }
  redirect(
    `/forgot-password?notice=${encodeURIComponent("If an account exists for that email, a recovery link has been sent.")}`,
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");
  if (password.length < 8) {
    redirect(messageUrl("/reset-password", "Use at least eight characters."));
  }
  if (password !== confirmation) {
    redirect(messageUrl("/reset-password", "The passwords do not match."));
  }
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(messageUrl("/forgot-password", "Request a new recovery link."));
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(messageUrl("/reset-password", getAuthErrorMessage(error)));
  await supabase.auth.signOut();
  redirect(`/login?notice=${encodeURIComponent("Password updated. Log in with your new password.")}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
