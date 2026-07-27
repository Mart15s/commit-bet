import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  getSupabaseConfigErrorMessage,
} from "@/lib/auth-config";

let adminClient: SupabaseClient | null = null;

export function createAdminClient() {
  if (!adminClient) {
    const configError = getSupabaseConfigErrorMessage();
    if (configError) throw new Error(configError);
    const { url } = getSupabaseConfig();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase service role key is not configured.");
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}
