// Lightweight in-memory abuse guard. Protects cost-bearing endpoints (Claude tokens, Tatum
// credits, Walrus storage, and especially the server signer's GAS on each seal) from spam.
//
// NOTE: state is per server instance. On serverless it's per-region/per-instance, so it raises
// the bar but isn't globally exact, back it with Upstash/Redis for production-grade limits.

type Bucket = { count: number; reset: number };
const windows = new Map<string, Bucket>();
const daily = new Map<string, Bucket>();

/** Sliding fixed-window limiter. Returns ok=false (+ retryAfter seconds) when over `limit`. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = windows.get(key);
  if (!b || now > b.reset) {
    windows.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Global per-day cap, a hard ceiling so a single endpoint can't drain gas/storage in a day. */
export function dailyCap(key: string, limit: number): boolean {
  const now = Date.now();
  const b = daily.get(key);
  if (!b || now > b.reset) {
    daily.set(key, { count: 1, reset: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
}

export function tooMany(retryAfter = 30): Response {
  return new Response(JSON.stringify({ error: "Rate limit exceeded, slow down." }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(retryAfter) },
  });
}
