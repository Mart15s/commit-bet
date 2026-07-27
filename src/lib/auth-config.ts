type AuthErrorLike = {
  code?: string;
  message: string;
  status?: number;
};

type SiteUrlEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

type SupabaseEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
};

function normalizeSiteUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(
  env: SiteUrlEnvironment = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
) {
  const vercelFallback = env.VERCEL_ENV === "preview"
    ? env.VERCEL_BRANCH_URL ?? env.VERCEL_URL
    : env.VERCEL_ENV === "production"
      ? env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL
      : undefined;

  return normalizeSiteUrl(
    env.NEXT_PUBLIC_SITE_URL
      ?? vercelFallback
      ?? "http://127.0.0.1:3000",
  );
}

function isLocalUrl(value: string) {
  try {
    const { hostname } = new URL(value);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

export function getSupabaseConfig(
  env: SupabaseEnvironment = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseConfigErrorMessage(
  env: SupabaseEnvironment = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
) {
  const { url, key } = getSupabaseConfig(env);

  if (!url || !key) {
    return "Supabase is not configured for this deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel.";
  }

  try {
    new URL(url);
  } catch {
    return "Supabase URL is invalid. Check NEXT_PUBLIC_SUPABASE_URL in Vercel.";
  }

  if ((env.VERCEL || env.VERCEL_ENV) && isLocalUrl(url)) {
    return "This deployment is still pointing at local Supabase. Set NEXT_PUBLIC_SUPABASE_URL to the hosted Supabase project URL in Vercel.";
  }

  return null;
}

export function getAuthErrorMessage(error: AuthErrorLike) {
  if (
    error.code === "invalid_credentials"
    || /invalid login credentials/i.test(error.message)
  ) {
    return "Email or password is incorrect.";
  }

  if (/email not confirmed/i.test(error.message)) {
    return "Confirm your email address before logging in.";
  }

  if (
    error.code === "over_email_send_rate_limit" ||
    error.status === 429 ||
    /email rate limit exceeded/i.test(error.message)
  ) {
    return "Confirmation email limit reached. Please wait up to one hour and try again.";
  }

  if (/fetch failed|failed to fetch|network request failed/i.test(error.message)) {
    return "Supabase connection failed. Check the production Supabase URL and publishable key in Vercel.";
  }

  return "Authentication could not be completed. Please try again.";
}
