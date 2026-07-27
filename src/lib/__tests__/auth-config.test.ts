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
        NEXT_PUBLIC_SITE_URL: "https://commit-bet.vercel.app///",
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "preview.vercel.app",
      }),
    ).toBe("https://commit-bet.vercel.app");
  });

  it("uses Vercel's stable branch URL in Preview", () => {
    expect(
      getSiteUrl({
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "commit-bet-git-release.vercel.app",
        VERCEL_URL: "commit-bet-unique.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "commit-bet.vercel.app",
      }),
    ).toBe("https://commit-bet-git-release.vercel.app");
  });

  it("falls back to VERCEL_URL in Preview when the branch URL is unavailable", () => {
    expect(
      getSiteUrl({
        VERCEL_ENV: "preview",
        VERCEL_URL: "commit-bet-unique.vercel.app/",
        VERCEL_PROJECT_PRODUCTION_URL: "commit-bet.vercel.app",
      }),
    ).toBe("https://commit-bet-unique.vercel.app");
  });

  it("uses Vercel's production domain in Production", () => {
    expect(
      getSiteUrl({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "commit-bet.vercel.app",
        VERCEL_URL: "commit-bet-unique.vercel.app",
      }),
    ).toBe("https://commit-bet.vercel.app");
  });

  it("uses localhost when no deployment URL is available", () => {
    expect(getSiteUrl({})).toBe("http://127.0.0.1:3000");
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
