/**
 * Vercel Serverless Function — Auth user lookup
 * After Clerk authenticates a user, this returns their Airtable record
 * (name, role, id) for attribution purposes.
 *
 * GET /api/auth-user?email=xxx → { id, name, email, role } | null
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  const reqUrl = new URL(req.url ?? '/', `https://placeholder`);
  const email  = reqUrl.searchParams.get('email');

  if (!email) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing email' }));
    return;
  }

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('משתמשים')}`,
    );
    url.searchParams.set('filterByFormula', `AND({אימייל}='${email}',{סטטוס}='פעיל')`);
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
      email: record.fields['אימייל'] ?? email,
      role:  record.fields['תפקיד']  ?? 'צוות',
    }));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch user' }));
  }
}
