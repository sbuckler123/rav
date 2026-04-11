/**
 * Vercel Serverless Function — Admin Videos proxy
 * All Airtable access is server-side; AIRTABLE_PAT never reaches the browser.
 *
 * GET    /api/admin-videos         → AdminVideo[] (resolved names + categories)
 * POST   /api/admin-videos         → create video
 * PATCH  /api/admin-videos?id=xxx  → update video
 * DELETE /api/admin-videos?id=xxx  → delete video
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// ─── helpers ─────────────────────────────────────────────────────────────────

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
  return '';
}

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

// ─── handler ─────────────────────────────────────────────────────────────────

export async function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  const url = new URL(req.url ?? '/', 'https://placeholder');
  const id  = url.searchParams.get('id');

  try {
    if (req.method === 'DELETE' && id) {
      await atDelete('שיעורי וידאו', id);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req)) as {
        title?: string; date?: string; duration?: string; description?: string;
        categoryId?: string; youtubeId?: string; views?: string; isNew?: boolean;
        status?: string; userId?: string;
      };
      const fields: Record<string, unknown> = {};
      if (body.title?.trim())       fields['כותרת']       = body.title.trim();
      if (body.date)                fields['תאריך']       = body.date;
      if (body.duration?.trim())    fields['משך']         = body.duration.trim();
      if (body.description?.trim()) fields['תיאור']       = body.description.trim();
      if (body.categoryId)          fields['קטגוריה']     = [body.categoryId];
      if (body.status)              fields['סטטוס']       = body.status;
      if (body.youtubeId?.trim())   fields['מזהה יוטיוב'] = body.youtubeId.trim();
      if (body.isNew !== undefined) fields['חדש']         = body.isNew;
      const views = parseInt(body.views ?? '');
      if (!isNaN(views))            fields['צפיות']       = views;
      if (body.userId)              fields['עודכן על ידי'] = [body.userId];
      await atUpdate('שיעורי וידאו', id, fields);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        title: string; date?: string; duration?: string; description?: string;
        categoryId?: string; youtubeId?: string; views?: string; isNew?: boolean;
        status?: string; userId?: string;
      };
      if (!body.title?.trim()) { res.statusCode = 400; res.end(JSON.stringify({ error: 'כותרת חסרה' })); return; }
      const fields: Record<string, unknown> = {
        'כותרת':    body.title.trim(),
        'סוג סרטון': 'youtube',
        'חדש':      body.isNew ?? false,
      };
      if (body.date)                fields['תאריך']       = body.date;
      if (body.duration?.trim())    fields['משך']         = body.duration.trim();
      if (body.description?.trim()) fields['תיאור']       = body.description.trim();
      if (body.categoryId)          fields['קטגוריה']     = [body.categoryId];
      if (body.status)              fields['סטטוס']       = body.status;
      if (body.youtubeId?.trim())   fields['מזהה יוטיוב'] = body.youtubeId.trim();
      const views = parseInt(body.views ?? '');
      if (!isNaN(views))            fields['צפיות']       = views;
      if (body.userId) { fields['נוצר על ידי'] = [body.userId]; fields['עודכן על ידי'] = [body.userId]; }
      const record = await atCreate('שיעורי וידאו', fields);
      res.statusCode = 200; res.end(JSON.stringify({ id: record.id })); return;
    }

    // GET — fetch videos + categories + users in parallel
    const [videosData, catsData, usersData] = await Promise.all([
      atFetch('שיעורי וידאו', {}, [{ field: 'תאריך', direction: 'desc' }]),
      atFetch('קטגוריות', {
        filterByFormula: `AND({סטטוס}='פעיל',FIND('שיעורי וידאו',ARRAYJOIN({טבלה})))`,
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

    const videos = videosData.records.map((r) => {
      const f = r.fields;
      const dateRaw = (f['תאריך'] as string) ?? '';
      const catIds  = (f['קטגוריה'] as string[]) ?? [];
      return {
        id:             r.id,
        title:          (f['כותרת'] as string) ?? '',
        dateRaw:        dateRaw ? dateRaw.split('T')[0] : '',
        dateDisplay:    formatDisplay(dateRaw),
        duration:       (f['משך'] as string) ?? '',
        description:    extractField(f['תיאור']),
        categoryId:     catIds[0] ?? '',
        category:       catMap[catIds[0] ?? ''] ?? '',
        videoType:      (f['סוג סרטון'] as string) ?? 'youtube',
        youtubeId:      ((f['מזהה יוטיוב'] as string) ?? '').split('&')[0].split('?')[0].trim(),
        videoUrl:       (f['קישור סרטון'] as string) ?? '',
        thumbnail:      (f['תמונה ממוזערת'] as string) ?? '',
        views:          (f['צפיות'] as number) ?? 0,
        isNew:          (f['חדש'] as boolean) ?? false,
        status:         (f['סטטוס'] as string) ?? '',
        linkId:         extractField(f['מזהה קישור']),
        createdByName:  getName(f['נוצר על ידי']),
        updatedByName:  getName(f['עודכן על ידי']),
      };
    });

    res.statusCode = 200; res.end(JSON.stringify(videos));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.statusCode = 500; res.end(JSON.stringify({ error: msg }));
  }
}
