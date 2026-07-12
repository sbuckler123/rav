/**
 * Vercel Serverless Function — Categories proxy
 * Fetches/writes from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET    /api/categories?forTable=xxx  → Category[] filtered by table
 * POST   /api/categories               → create category
 * PATCH  /api/categories?id=xxx        → rename category
 * DELETE /api/categories?id=xxx        → delete category
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { requireAdmin } from './_verifyAuth';
import { BODY_LIMITS, readBody } from './_readBody';
import { captureServerError } from './_sentry';
import { airtableRequest, serveCached } from './_publicCache';

/** Escapes a value for safe use inside a double-quoted Airtable formula string. */
function escapeAirtable(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE   = 'קטגוריות';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function airtableGet(params: Record<string, string> = {}, sort?: { field: string; direction?: string }[]) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (sort) {
    sort.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
    });
  }
  return airtableRequest<{ records: { id: string; fields: Record<string, unknown> }[] }>(
    url.toString(),
    { headers: { Authorization: `Bearer ${PAT}` } },
  );
}

async function airtableCreate(fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json() as Promise<{ id: string; fields: Record<string, unknown> }>;
}

async function airtableUpdate(id: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json();
}

async function airtableDelete(id: string) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json();
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  const reqUrl = new URL(req.url ?? '/', `https://placeholder`);
  const id        = reqUrl.searchParams.get('id');
  const forTable  = reqUrl.searchParams.get('forTable');

  // Default: every method requires an authorized admin. The single explicit
  // public exception is GET without ?admin=true (used by the public site for
  // category dropdowns) — kept narrow so a future maintainer can't widen it
  // by accident.
  const isPublicCategoryRead =
    req.method === 'GET' && reqUrl.searchParams.get('admin') !== 'true';

  // Public category dropdowns — cached + resilient. Handled before the auth
  // gate and shared try/catch since this is the only unauthenticated path.
  if (isPublicCategoryRead) {
    const filter = forTable
      ? `AND({סטטוס}="פעיל",FIND("${escapeAirtable(forTable)}",ARRAYJOIN({טבלה})))`
      : `{סטטוס}="פעיל"`;
    await serveCached(
      res,
      {
        key: `categories:public:${forTable ?? 'all'}`,
        ttlMs: 600_000,
        cacheControl: 's-maxage=600, stale-while-revalidate=86400',
        errorMessage: 'Categories operation failed',
        errorContext: { handler: 'categories', method: 'GET' },
      },
      async () => {
        const data = await airtableGet({ filterByFormula: filter }, [{ field: 'שם', direction: 'asc' }]);
        // Public response intentionally omits Airtable record IDs — clients
        // identify categories by name instead.
        return data.records.map((r) => ({ name: (r.fields['שם'] as string) ?? '' }));
      },
    );
    return;
  }

  if (!(await requireAdmin(req, res))) return;

  try {
    if (req.method === 'DELETE' && id) {
      await airtableDelete(id);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req, BODY_LIMITS.SMALL)) as { name?: string; status?: string; tables?: string[] };
      const fields: Record<string, unknown> = {};
      if (body.name != null)   fields['שם']     = String(body.name).trim();
      if (body.status != null) fields['סטטוס'] = body.status;
      if (body.tables != null) fields['טבלה']   = body.tables;
      if (Object.keys(fields).length) await airtableUpdate(id, fields);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (req.method === 'POST') {
      const { name, tables } = JSON.parse(await readBody(req, BODY_LIMITS.SMALL));
      const record = await airtableCreate({
        'שם': String(name).trim(),
        'סטטוס': 'פעיל',
        'טבלה': tables,
      });
      res.statusCode = 200;
      res.end(JSON.stringify({ id: record.id, name: String(name).trim() }));
      return;
    }

    // GET (admin view only — the public read is handled and returned above).
    // All categories with full fields, uncached.
    const data = await airtableGet({}, [{ field: 'שם', direction: 'asc' }]);
    const categories = data.records.map((r) => ({
      id:     r.id,
      name:   (r.fields['שם']     as string)   ?? '',
      status: (r.fields['סטטוס'] as string)   ?? 'פעיל',
      tables: (r.fields['טבלה']   as string[]) ?? [],
    }));
    res.statusCode = 200;
    res.end(JSON.stringify(categories));
  } catch (err) {
    captureServerError(err, { handler: 'categories', method: req.method ?? '' });
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Categories operation failed' }));
  }
}
