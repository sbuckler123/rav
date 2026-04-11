/**
 * Vercel Serverless Function — Admin Articles proxy
 *
 * GET    /api/admin-articles                        → AdminArticle[] (list)
 * GET    /api/admin-articles?id=xxx                 → full article record with user names
 * GET    /api/admin-articles?type=fieldChoices&field=... → string[] (select/multiselect choices)
 * POST   /api/admin-articles                        → create article
 * PATCH  /api/admin-articles?id=xxx                 → update article
 * DELETE /api/admin-articles?id=xxx                 → delete article
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { requireAuth } from './_verifyAuth';

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

async function getFieldChoices(tableName: string, fieldName: string): Promise<string[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers: auth() });
  if (!res.ok) return [];
  const data = await res.json() as { tables: { name: string; fields: { name: string; options?: { choices?: { name: string }[] } }[] }[] };
  const table = data.tables?.find((t) => t.name === tableName);
  const field = table?.fields?.find((f) => f.name === fieldName);
  return field?.options?.choices?.map((c) => c.name) ?? [];
}

function extractField(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null && 'value' in val) return String((val as { value: unknown }).value ?? '').trim();
  return '';
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }
  if (!(await requireAuth(req, res))) return;

  const url  = new URL(req.url ?? '/', 'https://placeholder');
  const id   = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  try {
    // ── Field choices ────────────────────────────────────────────────────────
    if (type === 'fieldChoices') {
      const field = url.searchParams.get('field') ?? '';
      const choices = await getFieldChoices('מאמרים', field);
      res.statusCode = 200; res.end(JSON.stringify(choices)); return;
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      await atDelete('מאמרים', id);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    // ── PATCH ────────────────────────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req)) as {
        title?: string; status?: string; yearNum?: string; categoryId?: string;
        tags?: string[]; fullContent?: string; pdfUrl?: string; keyPoints?: string;
        sources?: string; gregYearOptions?: string[]; userId?: string;
      };
      const fields: Record<string, unknown> = {};
      if (body.title?.trim())       fields['כותרת']        = body.title.trim();
      if (body.status)              fields['סטטוס']        = body.status;
      if (body.categoryId)          fields['קטגוריה']      = [body.categoryId];
      if (body.tags?.length)        fields['תגיות']        = body.tags;
      if (body.fullContent?.trim()) fields['תוכן מלא']     = body.fullContent.trim();
      if (body.pdfUrl?.trim())      fields['קישור PDF']    = body.pdfUrl.trim();
      if (body.keyPoints?.trim())   fields['נקודות מפתח'] = body.keyPoints.trim();
      if (body.sources?.trim())     fields['מקורות']       = body.sources.trim();
      if (body.yearNum?.trim()) {
        fields['שנה לועזית'] = (body.gregYearOptions?.length)
          ? [body.yearNum.trim()]
          : parseInt(body.yearNum);
      }
      if (body.userId) fields['עודכן על ידי'] = [body.userId];
      await atUpdate('מאמרים', id, fields);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        title: string; status?: string; yearNum?: string; categoryId?: string;
        tags?: string[]; fullContent?: string; pdfUrl?: string; keyPoints?: string;
        sources?: string; gregYearOptions?: string[]; userId?: string;
      };
      if (!body.title?.trim()) { res.statusCode = 400; res.end(JSON.stringify({ error: 'כותרת חסרה' })); return; }
      const fields: Record<string, unknown> = { 'כותרת': body.title.trim() };
      if (body.status)              fields['סטטוס']        = body.status;
      if (body.categoryId)          fields['קטגוריה']      = [body.categoryId];
      if (body.tags?.length)        fields['תגיות']        = body.tags;
      if (body.fullContent?.trim()) fields['תוכן מלא']     = body.fullContent.trim();
      if (body.pdfUrl?.trim())      fields['קישור PDF']    = body.pdfUrl.trim();
      if (body.keyPoints?.trim())   fields['נקודות מפתח'] = body.keyPoints.trim();
      if (body.sources?.trim())     fields['מקורות']       = body.sources.trim();
      if (body.yearNum?.trim()) {
        fields['שנה לועזית'] = (body.gregYearOptions?.length)
          ? [body.yearNum.trim()]
          : parseInt(body.yearNum);
      }
      if (body.userId) { fields['נוצר על ידי'] = [body.userId]; fields['עודכן על ידי'] = [body.userId]; }
      const record = await atCreate('מאמרים', fields);
      res.statusCode = 200; res.end(JSON.stringify({ id: record.id })); return;
    }

    // ── GET single article ───────────────────────────────────────────────────
    if (id) {
      const [articlesData, usersData] = await Promise.all([
        atFetch('מאמרים'),
        atFetch('משתמשים'),
      ]);
      const record = articlesData.records.find((r) => r.id === id);
      if (!record) { res.statusCode = 404; res.end(JSON.stringify({ error: 'לא נמצא' })); return; }

      const userMap: Record<string, string> = {};
      usersData.records.forEach((r) => { userMap[r.id] = (r.fields['שם'] as string) ?? ''; });
      const getName = (ids: unknown) => {
        if (!Array.isArray(ids) || !ids.length) return '';
        return userMap[ids[0] as string] ?? '';
      };

      const f = record.fields;
      res.statusCode = 200;
      res.end(JSON.stringify({
        id:            record.id,
        title:         extractField(f['כותרת']),
        status:        extractField(f['סטטוס']) || 'לא פעיל',
        yearNum:       String(f['שנה לועזית'] ?? ''),
        categoryId:    ((f['קטגוריה'] as string[]) ?? [])[0] ?? '',
        tags:          Array.isArray(f['תגיות']) ? f['תגיות'] as string[] : [],
        abstract:      extractField(f['תקציר']),
        fullContent:   extractField(f['תוכן מלא']),
        pdfUrl:        extractField(f['קישור PDF']),
        keyPoints:     extractField(f['נקודות מפתח']),
        sources:       extractField(f['מקורות']),
        readTime:      extractField(f['זמן קריאה']),
        linkId:        extractField(f['מזהה קישור']),
        createdByName: getName(f['נוצר על ידי']),
        updatedByName: getName(f['עודכן על ידי']),
      }));
      return;
    }

    // ── GET list ─────────────────────────────────────────────────────────────
    const [articlesData, catsData] = await Promise.all([
      atFetch('מאמרים', {}, [{ field: 'שנה לועזית', direction: 'desc' }]),
      atFetch('קטגוריות', {
        filterByFormula: `AND({סטטוס}='פעיל',FIND('מאמרים',ARRAYJOIN({טבלה})))`,
      }),
    ]);

    const catMap: Record<string, string> = {};
    catsData.records.forEach((r) => { catMap[r.id] = (r.fields['שם'] as string) ?? ''; });

    const articles = articlesData.records.map((r) => {
      const f       = r.fields;
      const catIds  = (f['קטגוריה'] as string[]) ?? [];
      return {
        id:       r.id,
        title:    extractField(f['כותרת']),
        journal:  extractField(f['כתב עת']),
        yeshiva:  extractField(f['מוסד']),
        yearNum:  (f['שנה לועזית'] as number) ?? 0,
        category: catIds.length ? (catMap[catIds[0]] ?? '') : '',
        abstract: extractField(f['תקציר']),
        linkId:   extractField(f['מזהה קישור']),
        status:   extractField(f['סטטוס']) || 'לא פעיל',
      };
    });

    res.statusCode = 200; res.end(JSON.stringify(articles));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.statusCode = 500; res.end(JSON.stringify({ error: msg }));
  }
}
