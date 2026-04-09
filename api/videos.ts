/**
 * Vercel Serverless Function — Videos proxy
 * Fetches from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET /api/videos → ShiurItem[]
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

function extractField(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null && 'value' in val)
    return String((val as { value: unknown }).value).trim();
  return undefined;
}

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  try {
    const [videosData, catsData] = await Promise.all([
      airtableFetch(
        'שיעורי וידאו',
        { filterByFormula: `{סטטוס} = "פעיל"` },
        [{ field: 'תאריך', direction: 'desc' }],
      ),
      airtableFetch('קטגוריות', {}),
    ]);

    const catMap: Record<string, string> = {};
    catsData.records.forEach((r) => { catMap[r.id] = (r.fields['שם'] as string) ?? ''; });

    const shiurim = videosData.records.map((r) => {
      const f = r.fields;
      const dateRaw = (f['תאריך'] as string) ?? '';
      const catIds = Array.isArray(f['קטגוריה']) ? (f['קטגוריה'] as string[]) : [];
      return {
        id: r.id,
        linkId: extractField(f['מזהה קישור']) ?? r.id,
        title: f['כותרת'] ?? '',
        date: formatDate(dateRaw),
        dateRaw,
        duration: f['משך'] ?? '',
        description: extractField(f['תיאור']) ?? '',
        category: catIds.length ? (catMap[catIds[0]] ?? '') : '',
        videoType: f['סוג סרטון'] ?? '',
        youtubeId: ((f['מזהה יוטיוב'] as string) ?? '').split('&')[0].split('?')[0].trim(),
        videoUrl: f['קישור סרטון'] ?? '',
        thumbnail: f['תמונה ממוזערת'] ?? '',
        views: f['צפיות'] ?? 0,
        isNew: f['חדש'] ?? false,
      };
    });

    res.statusCode = 200;
    res.end(JSON.stringify(shiurim));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch videos' }));
  }
}
