/**
 * Shared resilience layer for the public (unauthenticated) read endpoints.
 *
 * Airtable enforces a *monthly* API-call quota per plan (free ≈ 1 000 calls).
 * A live site with no server-side caching burns that in minutes, and once
 * Airtable starts returning errors the endpoints return 500 — which Vercel's
 * CDN does NOT cache — so every visit bypasses the cache and makes another
 * Airtable call, a self-sustaining storm that keeps the quota exhausted.
 *
 * This module breaks that loop with three layers:
 *   1. `airtableRequest` — retries transient failures with backoff, but FAILS
 *      FAST on the monthly billing-limit 429 (retrying it only wastes more of
 *      an already-spent quota).
 *   2. `serveCached` — a warm-instance in-memory cache + in-flight coalescing
 *      so repeat/concurrent hits make at most one Airtable call per TTL window.
 *   3. serve-stale-on-error — when a refresh fails, the last good payload is
 *      returned as a cacheable 200, so the CDN shields Airtable and lets the
 *      quota recover instead of being hammered by 500s.
 */

import type { ServerResponse } from 'http';
import { captureServerError } from './_sentry';

/**
 * Thrown when Airtable rejects with the monthly billing/API-cap 429.
 * Callers treat this as non-retryable — the quota is spent until it resets.
 */
export class AirtableBillingLimitError extends Error {
  constructor() {
    super('Airtable monthly API limit exceeded (PUBLIC_API_BILLING_LIMIT_EXCEEDED)');
    this.name = 'AirtableBillingLimitError';
  }
}

const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches an Airtable API URL and returns the parsed JSON on success.
 *
 * - Transient per-second rate limits (429 without a billing error) and 5xx are
 *   retried with exponential backoff, honouring the `Retry-After` header.
 * - The monthly billing-limit 429 throws `AirtableBillingLimitError` immediately
 *   (no retry).
 * - Other 4xx (auth / not-found / unprocessable) throw at once — not retryable.
 */
export async function airtableRequest<T = unknown>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, init);
    if (res.ok) return (await res.json()) as T;

    if (res.status === 429) {
      const bodyText = await res.text().catch(() => '');
      if (bodyText.includes('PUBLIC_API_BILLING_LIMIT_EXCEEDED')) {
        throw new AirtableBillingLimitError();
      }
      // Per-second rate limit — back off and retry.
      lastErr = new Error('Airtable error: 429');
      if (attempt < MAX_ATTEMPTS - 1) {
        const retryAfter = Number(res.headers.get('retry-after'));
        await sleep(
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt,
        );
        continue;
      }
      throw lastErr;
    }

    if (res.status >= 500) {
      lastErr = new Error(`Airtable error: ${res.status}`);
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(300 * 2 ** attempt);
        continue;
      }
      throw lastErr;
    }

    // Non-retryable client error.
    throw new Error(`Airtable error: ${res.status}`);
  }

  throw lastErr ?? new Error('Airtable request failed');
}

// ─── response-level cache ──────────────────────────────────────────────────────

type Entry = { body: string; storedAt: number };

const CACHE = new Map<string, Entry>();
const INFLIGHT = new Map<string, Promise<string>>();
const MAX_ENTRIES = 500;

function remember(key: string, body: string): void {
  CACHE.set(key, { body, storedAt: Date.now() });
  if (CACHE.size > MAX_ENTRIES) {
    // Evict the oldest entry to bound memory on detail-page (linkId) keys.
    let oldestKey: string | undefined;
    let oldestAt = Infinity;
    for (const [k, v] of CACHE) {
      if (v.storedAt < oldestAt) { oldestAt = v.storedAt; oldestKey = k; }
    }
    if (oldestKey !== undefined) CACHE.delete(oldestKey);
  }
}

export interface ServeOptions {
  /** Stable cache key for this response (e.g. `articles:list`, `events:detail:<id>`). */
  key: string;
  /** In-memory freshness window in ms; within it, Airtable is not called at all. */
  ttlMs: number;
  /** `Cache-Control` header value for the CDN. */
  cacheControl: string;
  /** Body returned when a first-ever fetch fails and there is no stale copy. */
  errorMessage?: string;
  /** Extra context attached to Sentry when a refresh fails. */
  errorContext?: Record<string, unknown>;
}

/**
 * Serves a JSON payload with in-memory caching, request coalescing, and
 * serve-stale-on-error. `produce` should perform the Airtable work and return
 * a JSON-serializable value; it is only invoked on a cache miss.
 */
export async function serveCached(
  res: ServerResponse,
  opts: ServeOptions,
  produce: () => Promise<unknown>,
): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', opts.cacheControl);

  const cached = CACHE.get(opts.key);
  if (cached && Date.now() - cached.storedAt < opts.ttlMs) {
    res.statusCode = 200;
    res.setHeader('X-Cache', 'hit');
    res.end(cached.body);
    return;
  }

  let inflight = INFLIGHT.get(opts.key);
  if (!inflight) {
    inflight = (async () => {
      const value = await produce();
      const body = JSON.stringify(value);
      remember(opts.key, body);
      return body;
    })().finally(() => INFLIGHT.delete(opts.key));
    INFLIGHT.set(opts.key, inflight);
  }

  try {
    const body = await inflight;
    res.statusCode = 200;
    res.setHeader('X-Cache', cached ? 'revalidated' : 'miss');
    res.end(body);
  } catch (err) {
    captureServerError(err, { ...opts.errorContext, cache: 'serveCached', key: opts.key });
    const stale = CACHE.get(opts.key);
    if (stale) {
      // Return the last good payload as a cacheable 200 so the CDN absorbs the
      // outage and Airtable gets the quiet window it needs to recover.
      res.statusCode = 200;
      res.setHeader('X-Cache', 'stale');
      res.end(stale.body);
      return;
    }
    res.statusCode = 500;
    res.end(JSON.stringify({ error: opts.errorMessage ?? 'Failed to fetch' }));
  }
}
