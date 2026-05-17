/**
 * Vercel Serverless Function — Auth user lookup
 * Returns the Airtable record for the CALLER (resolved from the verified JWT's
 * Clerk user id), so a signed-in user can only ever see their own admin record.
 *
 * GET /api/auth-user → { id, name, email, role } | null
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { requireAuth } from './_verifyAuth';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

/** Escapes a value for safe use inside a double-quoted Airtable formula string. */
function escapeAirtable(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  const payload = await requireAuth(req, res);
  if (!payload) return;

  const clerkId = payload.sub;
  if (!clerkId) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('משתמשים')}`,
    );
    url.searchParams.set(
      'filterByFormula',
      `AND({clerk_id}="${escapeAirtable(clerkId)}",{סטטוס}="פעיל")`,
    );
    url.searchParams.set('maxRecords', '1');

    const airtableRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${PAT}` },
    });

    if (!airtableRes.ok) throw new Error(`Airtable error: ${airtableRes.status}`);

    const data = (await airtableRes.json()) as {
      records: { id: string; fields: Record<string, unknown> }[];
    };

    const record = data.records[0];
    if (!record) {
      res.statusCode = 404;
      res.end(JSON.stringify(null));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      id:    record.id,
      name:  record.fields['שם']      ?? '',
      email: record.fields['אימייל'] ?? '',
      role:  record.fields['תפקיד']  ?? 'צוות',
    }));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch user' }));
  }
}
