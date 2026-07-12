/**
 * Vercel Serverless Function — על הפרק public proxy
 *
 * GET /api/al-haperek             → { items: AlHaperekItem[] }
 * GET /api/al-haperek?linkId=xxx  → AlHaperekItem | null
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { airtableRequest, serveCached } from './_publicCache';

const PAT        = process.env.AIRTABLE_PAT;
const BASE_ID    = process.env.AIRTABLE_BASE_ID;

type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'video'; url: string; caption?: string }
  | { type: 'images'; urls: string[]; caption?: string }
  | { type: 'pdf'; url: string; label?: string };

function extractField(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim() || undefined;
  if (typeof val === 'object' && val !== null && 'value' in val)
    return String((val as { value: unknown }).value).trim() || undefined;
  return undefined;
}

function parseBlocks(raw: unknown): ContentBlock[] {
  if (!raw || typeof raw !== 'string') return [];
  try { return JSON.parse(raw) as ContentBlock[]; } catch { return []; }
}

async function airtableFetch(
  table: string,
  params: Record<string, string> = {},
  sort?: { field: string; direction?: string }[],
) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (sort) sort.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
  });
  return airtableRequest<{ records: { id: string; fields: Record<string, unknown> }[] }>(
    url.toString(),
    { headers: { Authorization: `Bearer ${PAT}` } },
  );
}

function toItem(r: { id: string; fields: Record<string, unknown> }) {
  const f = r.fields;
  const linkId = extractField(f['מזהה קישור']);
  if (!linkId) return null;
  return {
    linkId,
    title:      (f['כותרת'] as string) ?? '',
    summary:    extractField(f['תקציר']),
    coverImage: extractField(f['תמונת כותרת']),
    tags:       Array.isArray(f['תגיות']) ? (f['תגיות'] as string[]) : [],
    date:       extractField(f['תאריך']),
    blocks:     parseBlocks(f['בלוקי תוכן']),
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!PAT || !BASE_ID) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  const reqUrl = new URL(req.url ?? '/', 'https://placeholder');

  // PDF proxy — only redirect to PDFs hosted on our Cloudinary cloud. The
  // target host AND the cloud-name path prefix must both match. Handled before
  // the cache since it neither reads Airtable nor returns JSON.
  const proxyUrl = reqUrl.searchParams.get('proxy');
  if (proxyUrl) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
    let parsed: URL | null = null;
    try { parsed = new URL(decodeURIComponent(proxyUrl)); } catch { /* invalid */ }

    const isAllowed =
      !!parsed &&
      !!cloudName &&
      parsed.protocol === 'https:' &&
      parsed.host === 'res.cloudinary.com' &&
      parsed.pathname.startsWith(`/${cloudName}/`);

    if (!isAllowed) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid proxy target' }));
      return;
    }

    res.writeHead(302, { Location: parsed!.toString(), 'Cache-Control': 'public, max-age=3600' });
    res.end();
    return;
  }

  const linkId = reqUrl.searchParams.get('linkId');

  await serveCached(
    res,
    {
      key: linkId ? `al-haperek:detail:${linkId}` : 'al-haperek:list',
      ttlMs: 300_000,
      cacheControl: 's-maxage=300, stale-while-revalidate=86400',
      errorMessage: 'Failed to fetch',
      errorContext: { handler: 'al-haperek', method: req.method ?? '', url: req.url ?? '' },
    },
    async () => {
      const data = await airtableFetch(
        'על הפרק',
        linkId
          ? {
              filterByFormula: `AND({סטטוס}="פורסם",{מזהה קישור}="${linkId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`,
              maxRecords: '1',
            }
          : { filterByFormula: '{סטטוס}="פורסם"' },
        linkId ? undefined : [{ field: 'תאריך', direction: 'desc' }],
      );

      if (linkId) {
        const record = data.records[0] ?? null;
        return record ? toItem(record) : null;
      }
      return {
        items: data.records
          .map(toItem)
          .filter((i): i is NonNullable<typeof i> => i !== null),
      };
    },
  );
}
