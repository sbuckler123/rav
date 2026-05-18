/**
 * Cloudflare Turnstile token verifier.
 *
 * Calls the Cloudflare siteverify endpoint to confirm a token issued by the
 * Turnstile widget on the client is valid. If TURNSTILE_SECRET_KEY isn't
 * set in env, verification is skipped (returns true) so the code can be
 * deployed before the secret is configured. Once the secret is in Vercel,
 * every public form submission requires a valid token.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { captureServerError } from './_sentry';

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  if (!SECRET) return true; // feature not configured yet — fail open
  if (!token || typeof token !== 'string') return false;

  try {
    const body = new URLSearchParams();
    body.set('secret', SECRET);
    body.set('response', token);
    if (remoteIp) body.set('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    captureServerError(err, { type: 'turnstile_verify' });
    return false; // fail closed on errors
  }
}

/**
 * Verifies the token and sends a 403 response if invalid.
 * Returns true on success; callers must `return` immediately when false.
 */
export async function requireTurnstile(
  req: IncomingMessage,
  res: ServerResponse,
  token: string | undefined,
): Promise<boolean> {
  const fwd = req.headers['x-forwarded-for'];
  const remoteIp =
    typeof fwd === 'string'
      ? fwd.split(',')[0]?.trim() || undefined
      : Array.isArray(fwd)
        ? fwd[0]
        : undefined;

  const ok = await verifyTurnstile(token, remoteIp);
  if (!ok) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Bot protection check failed. Please refresh and try again.' }));
    return false;
  }
  return true;
}
