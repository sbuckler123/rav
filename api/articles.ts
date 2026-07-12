/**
 * Vercel Serverless Function — Articles proxy
 * Fetches from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET /api/articles            → Article[]
 * GET /api/articles?linkId=xxx → ArticleDetail | null
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getCategoryMap } from './_categories';
import { airtableRequest, serveCached } from './_publicCache';

/** Escapes a value for safe use inside a double-quoted Airtable formula string. */
function escapeAirtable(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// ─── helpers ─────────────────────────────────────────────────────────────────

function extractField(val: unknown): string | undefined {
  if (val == null) return undefined;
  if (typeof val === 'string') return val.trim() || undefined;
  if (typeof val === 'object' && 'value' in val) {
    const v = (val as { value: unknown }).value;
    if (v == null) return undefined;
    return String(v).trim() || undefined;
  }
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
  return airtableRequest<{ records: { id: string; fields: Record<string, unknown> }[] }>(
    url.toString(),
    { headers: { Authorization: `Bearer ${PAT}` } },
  );
}

// ─── transformers ─────────────────────────────────────────────────────────────

function toArticleList(
  articlesData: { records: { id: string; fields: Record<string, unknown> }[] },
  catMap: Record<string, string>,
) {
  return articlesData.records
    .map((r) => {
      const f = r.fields;
      const linkId = extractField(f['מזהה קישור']);
      if (!linkId) return null;
      const catIds = Array.isArray(f['קטגוריה']) ? (f['קטגוריה'] as string[]) : [];
      const categoryName = catIds.length ? (catMap[catIds[0]] ?? '') : '';
      return {
        linkId,
        title: f['כותרת'] ?? '',
        journal: f['כתב עת'] ?? '',
        yeshiva: f['מוסד'] ?? '',
        year: extractField(Array.isArray(f['שנה עברית']) ? (f['שנה עברית'] as unknown[])[0] : f['שנה עברית']) ?? '',
        yearNum: f['שנה לועזית'] ?? 0,
        publishDate: typeof f['תאריך פרסום'] === 'string' ? f['תאריך פרסום'] : undefined,
        categories: categoryName ? [categoryName] : [],
        tags: Array.isArray(f['תגיות']) ? f['תגיות'] : [],
        readTime: extractField(f['זמן קריאה']),
        abstract: extractField(f['תקציר']),
        pdfUrl: extractField(f['קישור PDF']),
        keyPoints: extractField(f['נקודות מפתח']),
        sources: extractField(f['מקורות']),
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);
}

function toArticleDetail(record: { id: string; fields: Record<string, unknown> }, linkId: string) {
  const f = record.fields;
  const rawKeyPoints = extractField(f['נקודות מפתח']);
  const keyPoints = rawKeyPoints
    ? rawKeyPoints.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    linkId,
    title: f['כותרת'] ?? '',
    journal: f['כתב עת'] ?? '',
    yeshiva: f['מוסד'] ?? '',
    yearHebrew: f['שנה עברית'] ?? '',
    yearEnglish: String(f['שנה לועזית'] ?? ''),
    categories: Array.isArray(f['קטגוריות']) ? f['קטגוריות'] : (f['קטגוריות'] ? [f['קטגוריות']] : []),
    tags: Array.isArray(f['תגיות']) ? f['תגיות'] : (f['תגיות'] ? [f['תגיות']] : []),
    readTime: extractField(f['זמן קריאה']),
    abstract: extractField(f['תקציר']),
    fullContent: extractField(f['תוכן מלא']),
    pdfUrl: extractField(f['קישור PDF']),
    keyPoints,
    sources: extractField(f['מקורות']),
  };
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!PAT || !BASE_ID) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  const reqUrl = new URL(req.url ?? '/', `https://placeholder`);
  const linkId = reqUrl.searchParams.get('linkId');

  await serveCached(
    res,
    {
      key: linkId ? `articles:detail:${linkId}` : 'articles:list',
      ttlMs: 600_000,
      cacheControl: 's-maxage=600, stale-while-revalidate=86400',
      errorMessage: 'Failed to fetch articles',
      errorContext: { handler: 'articles', method: req.method ?? '', url: req.url ?? '' },
    },
    async () => {
      if (linkId) {
        const data = await airtableFetch('מאמרים', {
          filterByFormula: `{מזהה קישור}="${escapeAirtable(linkId)}"`,
          maxRecords: '1',
        });
        const record = data.records[0] ?? null;
        return record ? toArticleDetail(record, linkId) : null;
      }

      const [articlesData, catMap] = await Promise.all([
        airtableFetch(
          'מאמרים',
          { filterByFormula: `{סטטוס} = "פעיל"` },
          [{ field: 'תאריך פרסום', direction: 'desc' }, { field: 'שנה לועזית', direction: 'desc' }],
        ),
        getCategoryMap(),
      ]);

      return toArticleList(articlesData, catMap);
    },
  );
}
