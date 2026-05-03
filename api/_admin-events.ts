/**
 * Vercel Serverless Function — Admin Events proxy
 *
 * GET    /api/admin-events                           → AdminEvent[]
 * GET    /api/admin-events?type=gallery&ids=id1,...  → GalleryItem[]
 * GET    /api/admin-events?type=fieldChoices         → string[] (event type choices)
 * POST   /api/admin-events                           → create event (+ optional pendingImages)
 * PATCH  /api/admin-events?id=xxx                    → update event
 * DELETE /api/admin-events?id=xxx                    → delete event
 * POST   /api/admin-events?type=gallery              → add gallery item
 * PATCH  /api/admin-events?type=gallery&id=xxx       → update gallery item
 * DELETE /api/admin-events?type=gallery&id=xxx       → delete gallery item (unlinks from event)
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { captureServerError } from './_sentry';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

/** Accept DD.MM.YYYY or YYYY-MM-DD; always return YYYY-MM-DD for Airtable date fields. */
function toIsoDate(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split('.');
  if (parts.length === 3) {
    const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    if (!isNaN(Date.parse(iso))) return iso;
  }
  return undefined;
}

/** Format a YYYY-MM-DD string from Airtable to DD.MM.YYYY for display. */
function fromIsoDate(raw: string | undefined): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return `${d}.${m}.${y}`;
  }
  return raw;
}

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

async function atGetById(table: string, id: string) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, { headers: auth() });
  if (!res.ok) throw new Error(`Airtable ${table}/${id}: ${res.status}`);
  return res.json() as Promise<{ id: string; fields: Record<string, unknown> }>;
}

async function atCreate(table: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Airtable create ${table}: ${res.status} — ${body?.error?.message ?? JSON.stringify(body)}`);
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
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Airtable update ${table}: ${res.status} — ${body?.error?.message ?? JSON.stringify(body)}`);
  }
  return res.json();
}

async function atDelete(table: string, id: string) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE', headers: auth(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Airtable delete ${table}: ${res.status} — ${body?.error?.message ?? JSON.stringify(body)}`);
  }
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

export async function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  const url  = new URL(req.url ?? '/', 'https://placeholder');
  const id   = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  try {
    // ── Gallery operations ───────────────────────────────────────────────────
    if (type === 'gallery') {
      if (req.method === 'GET') {
        const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean);
        if (!ids.length) { res.statusCode = 200; res.end(JSON.stringify([])); return; }
        const formula = ids.length === 1
          ? `RECORD_ID()='${ids[0]}'`
          : `OR(${ids.map((i) => `RECORD_ID()='${i}'`).join(',')})`;
        const data = await atFetch('גלריה', { filterByFormula: formula });
        const items = data.records
          .map((r) => ({
            id:      r.id,
            url:     (r.fields['URL תמונה'] as string) ?? '',
            caption: (r.fields['כיתוב'] as string) ?? '',
            order:   (r.fields['סדר'] as number) ?? 0,
          }))
          .sort((a, b) => a.order - b.order);
        res.statusCode = 200; res.end(JSON.stringify(items)); return;
      }

      if (req.method === 'POST') {
        const body = JSON.parse(await readBody(req)) as {
          eventId: string; url: string; caption?: string; order?: string; userId?: string;
        };
        const gFields: Record<string, unknown> = { 'URL תמונה': body.url.trim() };
        if (body.caption?.trim()) gFields['כיתוב'] = body.caption.trim();
        const orderNum = parseInt(body.order ?? '');
        if (!isNaN(orderNum)) gFields['סדר'] = orderNum;
        const record = await atCreate('גלריה', gFields);

        // Fetch current gallery IDs and append
        const eventRecord = await atGetById('אירועים', body.eventId);
        const existingIds = (eventRecord.fields['גלריה'] as string[]) ?? [];
        const newIds = [...existingIds, record.id];
        await atUpdate('אירועים', body.eventId, { 'גלריה': newIds });
        res.statusCode = 200; res.end(JSON.stringify({ id: record.id, galleryIds: newIds })); return;
      }

      if (req.method === 'PATCH' && id) {
        const body = JSON.parse(await readBody(req)) as { url: string; caption?: string; order?: string };
        const fields: Record<string, unknown> = { 'URL תמונה': body.url.trim() };
        if (body.caption?.trim()) fields['כיתוב'] = body.caption.trim();
        const orderNum = parseInt(body.order ?? '');
        if (!isNaN(orderNum)) fields['סדר'] = orderNum;
        await atUpdate('גלריה', id, fields);
        res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
      }

      if (req.method === 'DELETE' && id) {
        const eventId = url.searchParams.get('eventId');
        await atDelete('גלריה', id);
        if (eventId) {
          const eventRecord = await atGetById('אירועים', eventId);
          const remaining = ((eventRecord.fields['גלריה'] as string[]) ?? []).filter((gid) => gid !== id);
          await atUpdate('אירועים', eventId, { 'גלריה': remaining });
          res.statusCode = 200; res.end(JSON.stringify({ galleryIds: remaining })); return;
        }
        res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
      }
    }

    // ── Field choices ────────────────────────────────────────────────────────
    if (type === 'fieldChoices') {
      const choices = await getFieldChoices('אירועים', 'סוג אירוע');
      res.statusCode = 200; res.end(JSON.stringify(choices)); return;
    }

    // ── Event CRUD ───────────────────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      await atDelete('אירועים', id);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req)) as {
        title?: string; eventType?: string; dateHebrew?: string;
        dateLocale?: string; location?: string; excerpt?: string; userId?: string;
      };
      const fields: Record<string, unknown> = {};
      if (body.title?.trim())      fields['כותרת']        = body.title.trim();
      if (body.eventType?.trim())  fields['סוג אירוע']    = body.eventType.trim();
      if (body.dateHebrew?.trim()) fields['תאריך עברי']   = body.dateHebrew.trim();
      const patchDate = toIsoDate(body.dateLocale);
      if (patchDate)               fields['תאריך לועזי']  = patchDate;
      if (body.location?.trim())   fields['מיקום']         = body.location.trim();
      if (body.excerpt?.trim())    fields['תקציר קצר']    = body.excerpt.trim();
      if (body.userId)             fields['עודכן על ידי'] = [body.userId];
      await atUpdate('אירועים', id, fields);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        title: string; eventType?: string; dateHebrew?: string; dateLocale?: string;
        location?: string; excerpt?: string; userId?: string;
        pendingImages?: { url: string; caption?: string; order?: string }[];
      };
      if (!body.title?.trim()) { res.statusCode = 400; res.end(JSON.stringify({ error: 'כותרת חסרה' })); return; }

      const fields: Record<string, unknown> = { 'כותרת': body.title.trim() };
      if (body.eventType?.trim())  fields['סוג אירוע']    = body.eventType.trim();
      if (body.dateHebrew?.trim()) fields['תאריך עברי']   = body.dateHebrew.trim();
      const createDate = toIsoDate(body.dateLocale);
      if (createDate)              fields['תאריך לועזי']  = createDate;
      if (body.location?.trim())   fields['מיקום']         = body.location.trim();
      if (body.excerpt?.trim())    fields['תקציר קצר']    = body.excerpt.trim();
      if (body.userId) { fields['נוצר על ידי'] = [body.userId]; fields['עודכן על ידי'] = [body.userId]; }

      const newEvent = await atCreate('אירועים', fields);

      // Create gallery records for pending images and link them
      if (body.pendingImages?.length) {
        const galleryIds: string[] = [];
        for (const img of body.pendingImages) {
          if (!img.url?.trim()) continue;
          const gFields: Record<string, unknown> = { 'URL תמונה': img.url.trim() };
          if (img.caption?.trim()) gFields['כיתוב'] = img.caption.trim();
          const orderNum = parseInt(img.order ?? '');
          if (!isNaN(orderNum)) gFields['סדר'] = orderNum;
          const gRecord = await atCreate('גלריה', gFields);
          galleryIds.push(gRecord.id);
        }
        if (galleryIds.length) {
          await atUpdate('אירועים', newEvent.id, { 'גלריה': galleryIds });
        }
      }

      res.statusCode = 200; res.end(JSON.stringify({ id: newEvent.id })); return;
    }

    // GET — list events with resolved user names
    const [eventsData, usersData] = await Promise.all([
      atFetch('אירועים', {}, [{ field: 'תאריך לועזי', direction: 'desc' }]),
      atFetch('משתמשים'),
    ]);

    const userMap: Record<string, string> = {};
    usersData.records.forEach((r) => { userMap[r.id] = (r.fields['שם'] as string) ?? ''; });
    const getName = (ids: unknown) => {
      if (!Array.isArray(ids) || !ids.length) return '';
      return userMap[ids[0] as string] ?? '';
    };

    const events = eventsData.records.map((r) => {
      const f = r.fields;
      return {
        id:            r.id,
        title:         extractField(f['כותרת']),
        eventType:     extractField(f['סוג אירוע']),
        dateHebrew:    extractField(f['תאריך עברי']),
        dateLocale:    extractField(f['תאריך לועזי']),
        location:      extractField(f['מיקום']),
        excerpt:       extractField(f['תקציר קצר']),
        linkId:        extractField(f['מזהה קישור']) || extractField(f['מזהה URL']),
        galleryIds:    Array.isArray(f['גלריה']) ? f['גלריה'] as string[] : [],
        createdByName: getName(f['נוצר על ידי']),
        updatedByName: getName(f['עודכן על ידי']),
      };
    });

    res.statusCode = 200; res.end(JSON.stringify(events));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    captureServerError(err, { handler: 'events', method: req.method ?? '', url: req.url ?? '' });
    res.statusCode = 500; res.end(JSON.stringify({ error: msg }));
  }
}
