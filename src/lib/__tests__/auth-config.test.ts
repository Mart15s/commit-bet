import { describe, expect, it } from "vitest";
import {
  getAuthErrorMessage,
  getSiteUrl,
  getSupabaseConfig,
  getSupabaseConfigErrorMessage,
} from "@/lib/auth-config";

describe("auth configuration", () => {
  it("prefers the configured site URL and removes trailing slashes", () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://commit-bet.vercel.app/",
        VERCEL_PROJECT_PRODUCTION_URL: "preview.vercel.app",
      }),
    ).toBe("https://commit-bet.vercel.app");
  });

  it("uses Vercel's production domain when no site URL is configured", () => {
    expect(
      getSiteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "commit-bet.vercel.app",
      }),
    ).toBe("https://commit-bet.vercel.app");
  });

  it("turns provider rate-limit errors into an actionable message", () => {
    expect(
      getAuthErrorMessage({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
        status: 429,
      }),
    ).toBe(
      "Confirmation email limit reached. Please wait up to one hour and try again.",
    );
  });

  it("uses Supabase publishable keys before legacy anon keys", () => {
    expect(
      getSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_key",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon-key",
      }),
    ).toEqual({
      url: "https://project.supabase.co",
      key: "sb_publishable_key",
    });
  });

  it("rejects local Supabase URLs in Vercel deployments", () => {
    expect(
      getSupabaseConfigErrorMessage({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_key",
        VERCEL: "1",
      }),
    ).toBe(
      "This deployment is still pointing at local Supabase. Set NEXT_PUBLIC_SUPABASE_URL to the hosted Supabase project URL in Vercel.",
    );
  });

  it("turns low-level fetch failures into deployment guidance", () => {
    expect(
      getAuthErrorMessage({
        message: "fetch failed",
      }),
    ).toBe(
      "Supabase connection failed. Check the production Supabase URL and publishable key in Vercel.",
    );
  });
});
