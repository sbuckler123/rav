/**
 * Vercel Serverless Function — Admin Shiurim proxy
 *
 * GET    /api/admin-shiurim         → Shiur[] (resolved names + categories)
 * POST   /api/admin-shiurim         → create shiur
 * PATCH  /api/admin-shiurim?id=xxx  → update shiur
 * DELETE /api/admin-shiurim?id=xxx  → delete shiur
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const auth = () => ({ Authorization: `Bearer ${PAT}` });

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
  if (!res.ok) throw new Error(`Airtable create ${table}: ${res.status}`);
  return res.json() as Promise<{ id: string }>;
}

async function atUpdate(table: string, id: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable update ${table}: ${res.status}`);
  return res.json();
}

async function atDelete(table: string, id: string) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE', headers: auth(),
  });
  if (!res.ok) throw new Error(`Airtable delete ${table}: ${res.status}`);
  return res.json();
}

function extractField(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null && 'value' in val) return String((val as { value: unknown }).value ?? '').trim();
  if (Array.isArray(val)) return '';
  return '';
}

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export async function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  const url = new URL(req.url ?? '/', 'https://placeholder');
  const id  = url.searchParams.get('id');

  try {
    if (req.method === 'DELETE' && id) {
      await atDelete('שיעורים', id);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req)) as {
        title?: string; date?: string; time?: string; location?: string;
        description?: string; categoryId?: string; userId?: string;
      };
      const fields: Record<string, unknown> = {};
      if (body.title?.trim())       fields['כותרת']        = body.title.trim();
      if (body.date)                fields['תאריך']        = body.date;
      if (body.time !== undefined)  fields['שעה']          = body.time.trim();
      if (body.location !== undefined) fields['מיקום']     = body.location.trim();
      if (body.description !== undefined) fields['תיאור']  = body.description.trim();
      if (body.categoryId)          fields['קטגוריה']      = [body.categoryId];
      if (body.userId)              fields['עודכן על ידי'] = [body.userId];
      await atUpdate('שיעורים', id, fields);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        title: string; date?: string; time?: string; location?: string;
        description?: string; categoryId?: string; userId?: string;
      };
      if (!body.title?.trim()) { res.statusCode = 400; res.end(JSON.stringify({ error: 'כותרת חסרה' })); return; }
      const fields: Record<string, unknown> = { 'כותרת': body.title.trim() };
      if (body.date)                fields['תאריך']        = body.date;
      if (body.time?.trim())        fields['שעה']          = body.time.trim();
      if (body.location?.trim())    fields['מיקום']        = body.location.trim();
      if (body.description?.trim()) fields['תיאור']        = body.description.trim();
      if (body.categoryId)          fields['קטגוריה']      = [body.categoryId];
      if (body.userId) { fields['נוצר על ידי'] = [body.userId]; fields['עודכן על ידי'] = [body.userId]; }
      const record = await atCreate('שיעורים', fields);
      res.statusCode = 200; res.end(JSON.stringify({ id: record.id })); return;
    }

    // GET — fetch shiurim + categories + users in parallel
    const [shiurimData, catsData, usersData] = await Promise.all([
      atFetch('שיעורים', {}, [{ field: 'תאריך', direction: 'desc' }]),
      atFetch('קטגוריות', {
        filterByFormula: `AND({סטטוס}='פעיל',FIND('שיעורים',ARRAYJOIN({טבלה})))`,
      }, [{ field: 'שם' }]),
      atFetch('משתמשים'),
    ]);

    const catMap: Record<string, string> = {};
    catsData.records.forEach((r) => { catMap[r.id] = (r.fields['שם'] as string) ?? ''; });
    const userMap: Record<string, string> = {};
    usersData.records.forEach((r) => { userMap[r.id] = (r.fields['שם'] as string) ?? ''; });
    const getName = (ids: unknown) => {
      if (!Array.isArray(ids) || !ids.length) return '';
      return userMap[ids[0] as string] ?? '';
    };

    const shiurim = shiurimData.records.map((r) => {
      const f       = r.fields;
      const dateRaw = extractField(f['תאריך']);
      const catIds  = (f['קטגוריה'] as string[]) ?? [];
      return {
        id:            r.id,
        title:         extractField(f['כותרת']) || extractField(f['שם']),
        dateRaw:       dateRaw ? dateRaw.split('T')[0] : '',
        dateDisplay:   formatDisplay(dateRaw),
        time:          extractField(f['שעה']) || extractField(f['זמן']),
        location:      extractField(f['מיקום']),
        description:   extractField(f['תיאור']),
        categoryId:    catIds[0] ?? '',
        category:      catMap[catIds[0] ?? ''] ?? '',
        linkId:        extractField(f['מזהה קישור']),
        createdByName: getName(f['נוצר על ידי']),
        updatedByName: getName(f['עודכן על ידי']),
      };
    });

    res.statusCode = 200; res.end(JSON.stringify(shiurim));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.statusCode = 500; res.end(JSON.stringify({ error: msg }));
  }
}
