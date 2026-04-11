/**
 * Vercel Serverless Function — Events proxy
 * Fetches from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET /api/events            → EventItem[]
 * GET /api/events?linkId=xxx → EventDetail | null
 */

import type { IncomingMessage, ServerResponse } from 'http';

/** Escapes a value for safe use inside a double-quoted Airtable formula string. */
function escapeAirtable(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// ─── helpers ─────────────────────────────────────────────────────────────────

function extractField(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null && 'value' in val)
    return String((val as { value: unknown }).value).trim();
  return undefined;
}

async function airtableFetch(
  table: string,
  params: Record<string, string> = {},
  sort?: { field: string; direction?: string }[],
) {
  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`,
  );
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (sort) {
    sort.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
    });
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown> }[] }>;
}

// ─── transformers ─────────────────────────────────────────────────────────────

function buildGalleryMap(galleryData: { records: { id: string; fields: Record<string, unknown> }[] }) {
  const map = new Map<string, { url: string; caption: string; order: number }>();
  for (const r of galleryData.records) {
    const url = extractField(r.fields['URL תמונה']);
    if (url) {
      map.set(r.id, {
        url,
        caption: extractField(r.fields['כיתוב']) ?? '',
        order: Number(r.fields['סדר']) || 99,
      });
    }
  }
  return map;
}

function toEventList(
  eventsData: { records: { id: string; fields: Record<string, unknown> }[] },
  galleryMap: Map<string, { url: string; caption: string; order: number }>,
) {
  return eventsData.records.map((r) => {
    const f = r.fields;
    const rawParticipants = extractField(f['משתתפים']);
    const participantsShort = rawParticipants
      ? rawParticipants.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    const linkedGalleryIds = Array.isArray(f['גלריה']) ? (f['גלריה'] as string[]) : [];
    const images = linkedGalleryIds
      .map((id) => galleryMap.get(id))
      .filter((img): img is { url: string; caption: string; order: number } => !!img)
      .sort((a, b) => a.order - b.order);

    return {
      id: r.id,
      slug: extractField(f['מזהה URL']) ?? r.id,
      linkId: extractField(f['מזהה קישור']) ?? r.id,
      title: f['כותרת'] ?? '',
      eventType: f['סוג אירוע'] ?? '',
      dateHebrew: f['תאריך עברי'] ?? '',
      dateLocale: f['תאריך לועזי'] ?? '',
      location: f['מיקום'] ?? '',
      excerpt: extractField(f['תקציר קצר']) ?? '',
      participantsShort,
      images: images.map(({ url, order }) => ({ url, order })),
      mainImageUrl: images.find((img) => img.order === 1)?.url ?? images[0]?.url,
    };
  });
}

function toEventDetail(
  record: { id: string; fields: Record<string, unknown> },
  linkId: string,
  galleryMap: Map<string, { url: string; caption: string; order: number }>,
) {
  const f = record.fields;

  const rawParticipants = extractField(f['משתתפים']);
  const participants = rawParticipants
    ? rawParticipants.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  const linkedGalleryIds = Array.isArray(f['גלריה']) ? (f['גלריה'] as string[]) : [];
  const gallery = linkedGalleryIds
    .map((id) => galleryMap.get(id))
    .filter((img): img is { url: string; caption: string; order: number } => !!img)
    .sort((a, b) => a.order - b.order);

  const rawQuotes = extractField(f['ציטוטים']);
  const quotes = rawQuotes
    ? rawQuotes.split('\n').map((line) => {
        const [text, author = ''] = line.split('|');
        return { text: text.trim(), author: author.trim() };
      }).filter((q) => q.text)
    : [];

  const rawSchedule = extractField(f['לוח זמנים']);
  const schedule = rawSchedule
    ? rawSchedule.split('\n').map((line) => {
        const match = line.match(/^(\S+)\s+(.+)$/);
        return match
          ? { time: match[1], description: match[2].trim() }
          : { time: '', description: line.trim() };
      }).filter((s) => s.description)
    : [];

  return {
    id: record.id,
    linkId,
    slug: extractField(f['מזהה URL']) ?? record.id,
    title: f['כותרת'] ?? '',
    eventType: f['סוג אירוע'] ?? '',
    dateHebrew: f['תאריך עברי'] ?? '',
    dateLocale: f['תאריך לועזי'] ?? '',
    location: f['מיקום'] ?? '',
    duration: f['משך'] ?? '',
    teurDescription: extractField(f['תיאור']) ?? '',
    description: extractField(f['תיאור מלא']) ?? extractField(f['תקציר קצר']) ?? '',
    participants,
    gallery,
    quotes,
    schedule,
  };
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  try {
    const reqUrl = new URL(req.url ?? '/', `https://placeholder`);
    const linkId = reqUrl.searchParams.get('linkId');

    const [eventsData, galleryData] = await Promise.all([
      airtableFetch(
        'אירועים',
        linkId ? { filterByFormula: `{מזהה קישור}="${escapeAirtable(linkId)}"`, maxRecords: '1' } : {},
        linkId ? undefined : [{ field: 'תאריך לועזי', direction: 'desc' }],
      ),
      airtableFetch('גלריה', {}),
    ]);

    const galleryMap = buildGalleryMap(galleryData);

    if (linkId) {
      const record = eventsData.records[0] ?? null;
      res.statusCode = 200;
      res.end(JSON.stringify(record ? toEventDetail(record, linkId, galleryMap) : null));
    } else {
      res.statusCode = 200;
      res.end(JSON.stringify(toEventList(eventsData, galleryMap)));
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch events' }));
  }
}
