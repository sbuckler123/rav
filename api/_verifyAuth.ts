/**
 * Server-side auth helper — verifies a Clerk session JWT and (optionally)
 * resolves the caller to an Airtable admin record with role/status checks.
 *
 * Two entry points:
 *   - requireAuth(req, res)              → 401 unless JWT signature is valid
 *   - requireAdmin(req, res, { role? })  → 401/403 unless caller is an active
 *                                          admin in the Airtable users table
 *
 * Handlers must `return` immediately when these helpers send a response.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { createVerify, createPublicKey } from 'node:crypto';
import { captureServerError } from './_sentry';

// ─── JWKS cache (refreshed every 5 minutes) ──────────────────────────────────

interface JwkKey { kid?: string; kty?: string; n?: string; e?: string }

interface JwtPayload {
  sub?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
}

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

async function verifyClerkJWT(token: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const [hB64, pB64, sigB64] = parts;

  const header  = JSON.parse(Buffer.from(hB64, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(pB64, 'base64url').toString()) as JwtPayload;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now)      throw new Error('Token expired');
  if (payload.nbf && payload.nbf > now + 10) throw new Error('Token not yet valid');

  const { keys } = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('No matching key in JWKS');

  // createPublicKey with format:'jwk' requires Node 15+
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const publicKey = createPublicKey({ key: jwk as any, format: 'jwk' });
  const verifier  = createVerify('RSA-SHA256');
  verifier.update(`${hB64}.${pB64}`);
  const valid = verifier.verify(publicKey, b64urlDecode(sigB64));
  if (!valid) throw new Error('Invalid JWT signature');

  return payload;
}

// ─── Admin lookup (cached 60s) ───────────────────────────────────────────────

export interface AdminContext {
  clerkId:    string;
  airtableId: string;
  email:      string;
  name:       string;
  role:       string;
}

const ADMIN_CACHE_TTL = 60_000;
const adminCache = new Map<string, { ctx: AdminContext; ts: number }>();

async function lookupAdminByClerkId(clerkId: string): Promise<AdminContext | null> {
  const cached = adminCache.get(clerkId);
  if (cached && Date.now() - cached.ts < ADMIN_CACHE_TTL) return cached.ctx;

  const PAT     = process.env.AIRTABLE_PAT;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  if (!PAT || !BASE_ID) return null;

  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('משתמשים')}`,
  );
  const safeId = clerkId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  url.searchParams.set(
    'filterByFormula',
    `AND({clerk_id}="${safeId}",{סטטוס}="פעיל")`,
  );
  url.searchParams.set('maxRecords', '1');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!res.ok) return null;

  const data = await res.json() as {
    records: { id: string; fields: Record<string, unknown> }[];
  };
  const r = data.records[0];
  if (!r) return null;

  const ctx: AdminContext = {
    clerkId,
    airtableId: r.id,
    email:      (r.fields['אימייל'] as string) ?? '',
    name:       (r.fields['שם']     as string) ?? '',
    role:       (r.fields['תפקיד'] as string) ?? 'צוות',
  };
  adminCache.set(clerkId, { ctx, ts: Date.now() });
  return ctx;
}

// ─── requireAuth (signature only) ────────────────────────────────────────────

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
    if (detail !== 'Token expired') {
      captureServerError(err, { type: 'auth_failure', detail });
    }
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized', detail }));
    return false;
  }
}

// ─── requireAdmin (signature + Airtable lookup + optional role) ──────────────

async function loadAdminContext(req: IncomingMessage): Promise<AdminContext> {
  const authHeader = (req.headers['authorization'] as string | undefined) ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) throw new Error('Missing token');

  const payload = await verifyClerkJWT(token);
  if (!payload.sub) throw new Error('Invalid token: missing sub');

  const ctx = await lookupAdminByClerkId(payload.sub);
  if (!ctx) throw new Error('Not an authorized admin');

  return ctx;
}

/** Tries to resolve an admin context but never sends a response. Returns null on any failure. */
export async function tryAdminContext(req: IncomingMessage): Promise<AdminContext | null> {
  try {
    return await loadAdminContext(req);
  } catch {
    return null;
  }
}

/**
 * Verifies caller is an active admin and (optionally) has the requested role.
 * On failure, sends 401/403 and returns null.
 */
export async function requireAdmin(
  req: IncomingMessage,
  res: ServerResponse,
  options: { requiredRole?: string } = {},
): Promise<AdminContext | null> {
  let ctx: AdminContext;
  try {
    ctx = await loadAdminContext(req);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const isAuthFailure =
      detail === 'Missing token' ||
      detail === 'Invalid JWT format' ||
      detail === 'Invalid JWT signature' ||
      detail === 'Token expired' ||
      detail === 'Token not yet valid' ||
      detail === 'Invalid token: missing sub' ||
      detail === 'No matching key in JWKS';

    if (!isAuthFailure || detail === 'Not an authorized admin') {
      // Log everything except expired tokens (which are expected churn)
      captureServerError(err, { type: 'admin_auth_failure', detail });
    }

    res.statusCode = isAuthFailure ? 401 : 403;
    res.end(JSON.stringify({ error: isAuthFailure ? 'Unauthorized' : 'Forbidden' }));
    return null;
  }

  if (options.requiredRole && ctx.role !== options.requiredRole) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return null;
  }

  return ctx;
}
