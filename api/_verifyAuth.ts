/**
 * Server-side auth helper — verifies a Clerk session JWT from the Authorization header.
 *
 * Usage in a handler:
 *   if (!(await requireAuth(req, res))) return;
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { verifyToken } from '@clerk/backend';

/**
 * Reads `Authorization: Bearer <token>` from the request, verifies it with Clerk,
 * and returns true. If missing or invalid, writes a 401 response and returns false.
 */
export async function requireAuth(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing auth configuration' }));
    return false;
  }

  const authHeader = (req.headers['authorization'] as string | undefined) ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }

  try {
    await verifyToken(token, { secretKey });
    return true;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized', detail }));
    return false;
  }
}
