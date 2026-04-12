/**
 * Server-side auth helper — verifies a Clerk session JWT from the Authorization header.
 *
 * Uses Node.js built-in Web Crypto API instead of @clerk/backend to avoid
 * esbuild bundling failures caused by @clerk/backend's "#crypto" subpath import.
 *
 * Usage in a handler:
 *   if (!(await requireAuth(req, res))) return;
 */

import type { IncomingMessage, ServerResponse } from 'http';

// Node.js 18+ exposes crypto as a global — no import needed, avoids esbuild bundling issues.
// Accessed lazily inside functions so module init never throws.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSubtle = (): SubtleCrypto => (globalThis as any).crypto.subtle as SubtleCrypto;

// ─── JWKS cache (refreshed every 5 minutes) ──────────────────────────────────

const jwksCache: { data: { keys: JsonWebKey[] } | null; ts: number } = { data: null, ts: 0 };

async function getJwks(): Promise<{ keys: JsonWebKey[] }> {
  const now = Date.now();
  if (jwksCache.data && now - jwksCache.ts < 300_000) return jwksCache.data;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY not configured');

  const res = await fetch('https://api.clerk.com/v1/jwks', {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);

  const data = await res.json() as { keys: JsonWebKey[] };
  jwksCache.data = data;
  jwksCache.ts = now;
  return data;
}

// ─── JWT verification ─────────────────────────────────────────────────────────

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    s.length + (4 - s.length % 4) % 4, '='
  );
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function verifyClerkJWT(token: string): Promise<void> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const [hB64, pB64, sigB64] = parts;

  const header  = JSON.parse(Buffer.from(hB64, 'base64url').toString('utf-8'));
  const payload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf-8'));

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now)      throw new Error('Token expired');
  if (payload.nbf && payload.nbf > now + 10) throw new Error('Token not yet valid');

  // Find the matching JWK by key ID
  const { keys } = await getJwks();
  const jwk = keys.find((k) => (k as Record<string, unknown>).kid === header.kid);
  if (!jwk) throw new Error('No matching key in JWKS');

  // Import key and verify signature — supports both RS256 (RSA) and ES256 (EC)
  const kty = (jwk as Record<string, unknown>).kty as string;
  const importAlg: RsaHashedImportParams | EcKeyImportParams =
    kty === 'EC'
      ? { name: 'ECDSA', namedCurve: ((jwk as Record<string, unknown>).crv as string) ?? 'P-256' }
      : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
  const verifyAlg: AlgorithmIdentifier | RsaPssParams | EcdsaParams =
    kty === 'EC'
      ? { name: 'ECDSA', hash: 'SHA-256' }
      : 'RSASSA-PKCS1-v1_5';

  const subtle = getSubtle();
  const cryptoKey = await subtle.importKey('jwk', jwk, importAlg, false, ['verify']);
  const valid = await subtle.verify(
    verifyAlg,
    cryptoKey,
    b64urlToBytes(sigB64),
    new TextEncoder().encode(`${hB64}.${pB64}`),
  );
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
