/**
 * Server-side auth helper — verifies a Clerk session JWT from the Authorization header.
 *
 * Uses Node.js traditional crypto (createVerify / createPublicKey) via dynamic import
 * to avoid both @clerk/backend esbuild issues and Web Crypto availability problems.
 *
 * Usage in a handler:
 *   if (!(await requireAuth(req, res))) return;
 */

import type { IncomingMessage, ServerResponse } from 'http';

// ─── JWKS cache (refreshed every 5 minutes) ──────────────────────────────────

interface JwkKey { kid?: string; kty?: string; n?: string; e?: string }

let jwksCache: { keys: JwkKey[] } | null = null;
let jwksCacheTs = 0;

async function getJwks(): Promise<{ keys: JwkKey[] }> {
  const now = Date.now();
  if (jwksCache && now - jwksCacheTs < 300_000) return jwksCache;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY not configured');

  const res = await fetch('https://api.clerk.com/v1/jwks', {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);

  jwksCache = await res.json() as { keys: JwkKey[] };
  jwksCacheTs = now;
  return jwksCache;
}

// ─── JWT verification ─────────────────────────────────────────────────────────

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function verifyClerkJWT(token: string): Promise<void> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const [hB64, pB64, sigB64] = parts;

  const header  = JSON.parse(Buffer.from(hB64, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(pB64, 'base64url').toString());

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now)      throw new Error('Token expired');
  if (payload.nbf && payload.nbf > now + 10) throw new Error('Token not yet valid');

  // Find the matching JWK
  const { keys } = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('No matching key in JWKS');

  // Use Node.js built-in crypto via dynamic import — avoids any module-level
  // bundling/resolution issues with esbuild.
  const { createVerify, createPublicKey } = await import('node:crypto');

  // createPublicKey with format:'jwk' is supported in Node.js 15+
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const publicKey = createPublicKey({ key: jwk as any, format: 'jwk' });

  // Verify RS256 (Clerk's default signing algorithm)
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${hB64}.${pB64}`);
  const valid = verifier.verify(publicKey, b64urlDecode(sigB64));
  if (!valid) throw new Error('Invalid JWT signature');
}

// ─── requireAuth ──────────────────────────────────────────────────────────────

/**
 * Reads `Authorization: Bearer <token>` from the request, verifies it with Clerk's JWKS,
 * and returns true. If missing or invalid, writes a 401 response and returns false.
 */
export async function requireAuth(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const authHeader = (req.headers['authorization'] as string | undefined) ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }

  try {
    await verifyClerkJWT(token);
    return true;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized', detail }));
    return false;
  }
}
