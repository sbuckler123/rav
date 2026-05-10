/**
 * Security helpers: CORS allowlist check, IP extraction, in-memory rate limiting.
 *
 * Notes:
 *   - The rate limiter uses an in-process Map. Vercel can scale horizontally,
 *     so the limit is per-instance, not global — it catches obvious bursts
 *     but is best-effort. For strict global limits, back this with Vercel KV
 *     or Upstash Redis.
 *   - CORS check is opt-in — call it from public POST endpoints. Browsers
 *     enforce it via the Origin header; non-browser clients (curl, scripts)
 *     can bypass, so combine with rate limiting and input validation.
 */

import type { IncomingMessage, ServerResponse } from 'http';

// ─── Origin allowlist ────────────────────────────────────────────────────────

/** Comma-separated list in env var, e.g. "https://example.com,https://www.example.com" */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

/**
 * Returns true when the request is allowed to proceed by Origin check.
 * - No Origin header (curl, server-to-server) → allow
 * - Origin matches allowlist → allow
 * - Origin doesn't match → reject
 *
 * If ALLOWED_ORIGINS is unset, allows all (development default).
 */
export function isOriginAllowed(req: IncomingMessage): boolean {
  if (ALLOWED_ORIGINS.length === 0) return true;
  const origin = (req.headers.origin as string | undefined) ?? '';
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Validates origin and writes a 403 if rejected. Returns true to continue.
 * Sets the matching CORS response headers when origin is allowed and present.
 */
export function enforceOrigin(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = (req.headers.origin as string | undefined) ?? '';

  if (!isOriginAllowed(req)) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Origin not allowed' }));
    return false;
  }

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  return true;
}

// ─── Client IP extraction ────────────────────────────────────────────────────

export function getClientIp(req: IncomingMessage): string {
  const fwd = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
  const first = fwd.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

// ─── Rate limiting (in-process) ──────────────────────────────────────────────

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

/** Periodically prune expired entries so the Map doesn't grow unbounded. */
function maybePrune(now: number) {
  if (buckets.size < 1000) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

/**
 * Returns true when the call is within the limit for `key` over `windowMs`.
 * `key` is typically `${endpoint}:${ip}`.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  maybePrune(now);
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/**
 * Convenience wrapper: returns true if allowed; otherwise writes 429 and returns false.
 * Caller MUST `return` immediately when this returns false.
 */
export function enforceRateLimit(
  req: IncomingMessage,
  res: ServerResponse,
  endpoint: string,
  limit: number,
  windowMs: number,
): boolean {
  const ip = getClientIp(req);
  const ok = checkRateLimit(`${endpoint}:${ip}`, limit, windowMs);
  if (!ok) {
    res.statusCode = 429;
    res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
    res.end(JSON.stringify({ error: 'Too many requests' }));
  }
  return ok;
}
