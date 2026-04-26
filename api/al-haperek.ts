/**
 * Vercel Serverless Function — על הפרק public proxy
 *
 * GET /api/al-haperek             → { items: AlHaperekItem[] }
 * GET /api/al-haperek?linkId=xxx  → AlHaperekItem | null
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { createHash } from 'crypto';

const PAT        = process.env.AIRTABLE_PAT;
const BASE_ID    = process.env.AIRTABLE_BASE_ID;
const CLD_SECRET = process.env.CLOUDINARY_API_SECRET;

function cloudinarySignedUrl(rawUrl: string): string {
  // Extract the path segment after /upload/ and generate a signed delivery URL.
  // Cloudinary signed delivery: s--{8-char base64url SHA1(pathAfterUpload + secret)}--
  const match = rawUrl.match(/\/upload\/(.+)$/);
  if (!match || !CLD_SECRET) return rawUrl;
  const toSign = match[1]; // e.g. "v1234567890/rav/filename.pdf"
  const sig = createHash('sha1')
    .update(toSign + CLD_SECRET)
    .digest('base64')
    .replace(/\//g, '_')
    .replace(/\+/g, '-')
    .slice(0, 8);
  return rawUrl.replace('/upload/', `/upload/s--${sig}--/`);
}

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
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${PAT}` } });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown> }[] }>;
}

function toItem(r: { id: string; fields: Record<string, unknown> }) {
  const f = r.fields;
  return {
    linkId:     extractField(f['מזהה קישור']) ?? r.id,
    title:      (f['כותרת'] as string) ?? '',
    summary:    extractField(f['תקציר']),
    coverImage: extractField(f['תמונת כותרת']),
    categoryId: Array.isArray(f['קטגוריה']) ? (f['קטגוריה'] as string[])[0] : undefined,
    tags:       Array.isArray(f['תגיות']) ? (f['תגיות'] as string[]) : [],
    date:       extractField(f['תאריך']),
    blocks:     parseBlocks(f['בלוקי תוכן']),
  };
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
    const reqUrl = new URL(req.url ?? '/', 'https://placeholder');

    // PDF proxy — generate signed Cloudinary delivery URL and redirect
    const proxyUrl = reqUrl.searchParams.get('proxy');
    if (proxyUrl) {
      const signed = cloudinarySignedUrl(decodeURIComponent(proxyUrl));
      res.writeHead(302, { Location: signed, 'Cache-Control': 'public, max-age=3600' });
      res.end();
      return;
    }

    const linkId = reqUrl.searchParams.get('linkId');

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
      res.statusCode = 200;
      res.end(JSON.stringify(record ? toItem(record) : null));
    } else {
      res.statusCode = 200;
      res.end(JSON.stringify({ items: data.records.map(toItem) }));
    }
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch' }));
  }
}
