/**
 * Vercel Serverless Function — Shiurim proxy
 * Fetches from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET /api/shiurim → ShiurEvent[]
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getCategoryMap } from './_categories';
import { airtableRequest, serveCached } from './_publicCache';

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
  return airtableRequest<{ records: { id: string; fields: Record<string, unknown> }[] }>(
    url.toString(),
    { headers: { Authorization: `Bearer ${PAT}` } },
  );
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!PAT || !BASE_ID) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  await serveCached(
    res,
    {
      key: 'shiurim:list',
      ttlMs: 600_000,
      cacheControl: 's-maxage=600, stale-while-revalidate=86400',
      errorMessage: 'Failed to fetch shiurim',
      errorContext: { handler: 'shiurim', method: req.method ?? '', url: req.url ?? '' },
    },
    async () => {
      const [shiurimData, catMap] = await Promise.all([
        airtableFetch('שיעורים', {}, [{ field: 'תאריך', direction: 'asc' }]),
        getCategoryMap(),
      ]);

      return shiurimData.records
      .map((r) => {
        const f = r.fields;
        const linkId = extractField(f['מזהה קישור']);
        if (!linkId) return null;
        const dateRaw = (f['תאריך'] as string) ?? '';
        const catIds = Array.isArray(f['קטגוריה']) ? (f['קטגוריה'] as string[]) : [];
        return {
          linkId,
          title: extractField(f['כותרת']) ?? extractField(f['שם']) ?? '',
          date: formatDate(dateRaw),
          dateRaw,
          time: extractField(f['שעה']) ?? extractField(f['זמן']) ?? '',
          location: extractField(f['מיקום']) ?? '',
          description: extractField(f['תיאור']) ?? '',
          category: catIds.length ? (catMap[catIds[0]] ?? '') : '',
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    },
  );
}
