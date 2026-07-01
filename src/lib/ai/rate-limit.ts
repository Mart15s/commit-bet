import "server-only";

const buckets = new Map<string, number[]>();

export function checkAIRateLimit(key: string, limit = 12, windowMs = 60_000) {
  const now = Date.now();
  const since = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((time) => time > since);
  if (hits.length >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}
