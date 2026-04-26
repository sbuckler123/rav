/**
 * Admin handler — על הפרק CRUD
 * Routed via /api/admin?section=al-haperek
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const TABLE = 'על הפרק';

function readBody(req: IncomingMessage, maxBytes = 200_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) { req.destroy(); reject(new Error('Request too large')); return; }
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const auth = () => ({ Authorization: `Bearer ${PAT}` });

function extractField(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim() || undefined;
  if (typeof val === 'object' && val !== null && 'value' in val)
    return String((val as { value: unknown }).value).trim() || undefined;
  return undefined;
}

async function atFetch(table: string, params: Record<string, string> = {}, sort?: { field: string; direction?: string }[]) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (sort) sort.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
  });
  const res = await fetch(url.toString(), { headers: auth() });
  if (!res.ok) throw new Error(`Airtable ${table}: ${res.status}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown> }[] }>;
}

async function atCreate(table: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string; type?: string } };
    const detail = body?.error?.message ?? body?.error?.type ?? '';
    throw new Error(`Airtable create ${res.status}${detail ? ': ' + detail : ''}`);
  }
  return res.json() as Promise<{ id: string }>;
}

async function atUpdate(table: string, id: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string; type?: string } };
    const detail = body?.error?.message ?? body?.error?.type ?? '';
    console.error('Airtable PATCH error', res.status, detail, JSON.stringify(fields).slice(0, 500));
    throw new Error(`Airtable update ${res.status}${detail ? ': ' + detail : ''}`);
  }
  return res.json();
}

async function atDelete(table: string, id: string) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE', headers: auth(),
  });
  if (!res.ok) throw new Error(`Airtable delete: ${res.status}`);
  return res.json();
}

function toAdminItem(r: { id: string; fields: Record<string, unknown> }) {
  const f = r.fields;
  let blocks: unknown[] = [];
  try { blocks = JSON.parse((f['בלוקי תוכן'] as string) ?? '[]'); } catch { /* empty */ }

  return {
    id:         r.id,
    linkId:     extractField(f['מזהה קישור']) ?? r.id,
    title:      (f['כותרת'] as string) ?? '',
    summary:    extractField(f['תקציר']) ?? '',
    coverImage: extractField(f['תמונת כותרת']) ?? '',
    categoryId: Array.isArray(f['קטגוריה']) ? (f['קטגוריה'] as string[])[0] : '',
    tags:       Array.isArray(f['תגיות']) ? (f['תגיות'] as string[]) : [],
    date:       extractField(f['תאריך']) ?? '',
    status:     (f['סטטוס'] as string) ?? 'טיוטה',
    blocks,
  };
}

function generateLinkId(title: string): string {
  const date = new Date().toISOString().split('T')[0];
  const rand = Math.random().toString(36).slice(2, 6);
  const slug = title
    .slice(0, 20)
    .replace(/\s+/g, '-')
    .replace(/[^\w֐-׿-]/g, '')
    .toLowerCase();
  return `${date}-${slug || rand}`;
}

export async function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  const url = new URL(req.url ?? '/', 'https://placeholder');
  const id   = url.searchParams.get('id');

  // GET all
  if (req.method === 'GET' && !id) {
    const data = await atFetch(TABLE, {}, [{ field: 'תאריך', direction: 'desc' }]);
    res.statusCode = 200;
    res.end(JSON.stringify(data.records.map(toAdminItem)));
    return;
  }

  // GET single by id
  if (req.method === 'GET' && id) {
    const data = await atFetch(TABLE, { filterByFormula: `RECORD_ID()="${id}"`, maxRecords: '1' });
    const record = data.records[0] ?? null;
    res.statusCode = 200;
    res.end(JSON.stringify(record ? toAdminItem(record) : null));
    return;
  }

  // POST create
  if (req.method === 'POST') {
    const body = JSON.parse(await readBody(req)) as {
      title: string; linkId?: string; summary?: string; coverImage?: string;
      categoryId?: string; tags?: string[]; date?: string; status?: string;
      blocks?: unknown[];
    };
    const fields: Record<string, unknown> = {
      'כותרת':       body.title,
      'מזהה קישור':  body.linkId?.trim() || generateLinkId(body.title),
      'תקציר':       body.summary ?? '',
      'תמונת כותרת': body.coverImage ?? '',
      'בלוקי תוכן':  JSON.stringify(body.blocks ?? []),
      'סטטוס':       body.status ?? 'טיוטה',
    };
    if (body.date)        fields['תאריך']    = body.date;
    if (body.tags?.length) fields['תגיות']   = body.tags;
    if (body.categoryId)  fields['קטגוריה'] = [body.categoryId];
    const record = await atCreate(TABLE, fields);
    res.statusCode = 200;
    res.end(JSON.stringify({ id: record.id }));
    return;
  }

  // PATCH update
  if (req.method === 'PATCH' && id) {
    const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    if (body.title      !== undefined) fields['כותרת']       = body.title;
    if (body.linkId     !== undefined) fields['מזהה קישור']  = body.linkId;
    if (body.summary    !== undefined) fields['תקציר']       = body.summary;
    if (body.coverImage !== undefined) fields['תמונת כותרת'] = body.coverImage;
    if (body.blocks     !== undefined) fields['בלוקי תוכן']  = JSON.stringify(body.blocks);
    if (body.status     !== undefined) fields['סטטוס']       = body.status;
    if (body.date       !== undefined) fields['תאריך']       = body.date || null;
    if (body.tags       !== undefined) fields['תגיות']       = body.tags;
    if (body.categoryId !== undefined) fields['קטגוריה']    = body.categoryId ? [body.categoryId] : [];
    await atUpdate(TABLE, id, fields);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // DELETE
  if (req.method === 'DELETE' && id) {
    await atDelete(TABLE, id);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
