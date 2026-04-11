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
import { requireAuth } from './_verifyAuth';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE   = 'קטגוריות';

// ─── helpers ─────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function airtableGet(params: Record<string, string> = {}, sort?: { field: string; direction?: string }[]) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (sort) {
    sort.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
    });
  }
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${PAT}` } });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown> }[] }>;
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

  // Public: GET without ?admin=true (used by the public site for category dropdowns)
  const isPublicRead = req.method === 'GET' && reqUrl.searchParams.get('admin') !== 'true';
  if (!isPublicRead && !(await requireAuth(req, res))) return;

  try {
    if (req.method === 'DELETE' && id) {
      await airtableDelete(id);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req)) as { name?: string; status?: string; tables?: string[] };
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
      const { name, tables } = JSON.parse(await readBody(req));
      const record = await airtableCreate({
        'שם': String(name).trim(),
        'סטטוס': 'פעיל',
        'טבלה': tables,
      });
      res.statusCode = 200;
      res.end(JSON.stringify({ id: record.id, name: String(name).trim() }));
      return;
    }

    // GET
    const admin = reqUrl.searchParams.get('admin');
    if (admin === 'true') {
      // Admin view: all categories with full fields (no cache)
      const data = await airtableGet({}, [{ field: 'שם', direction: 'asc' }]);
      const categories = data.records.map((r) => ({
        id:     r.id,
        name:   (r.fields['שם']     as string)   ?? '',
        status: (r.fields['סטטוס'] as string)   ?? 'פעיל',
        tables: (r.fields['טבלה']   as string[]) ?? [],
      }));
      res.statusCode = 200;
      res.end(JSON.stringify(categories));
      return;
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    const filter = forTable
      ? `AND({סטטוס}='פעיל',FIND('${forTable}',ARRAYJOIN({טבלה})))`
      : `{סטטוס}='פעיל'`;
    const data = await airtableGet(
      { filterByFormula: filter },
      [{ field: 'שם', direction: 'asc' }],
    );
    const categories = data.records.map((r) => ({ id: r.id, name: (r.fields['שם'] as string) ?? '' }));
    res.statusCode = 200;
    res.end(JSON.stringify(categories));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Categories operation failed' }));
  }
}
