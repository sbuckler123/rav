/**
 * Vercel Serverless Function — Articles proxy
 * Fetches from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET /api/articles            → Article[]
 * GET /api/articles?linkId=xxx → ArticleDetail | null
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

function toArticleList(
  articlesData: { records: { id: string; fields: Record<string, unknown> }[] },
  catMap: Record<string, string>,
) {
  return articlesData.records.map((r) => {
    const f = r.fields;
    const catIds = Array.isArray(f['קטגוריה']) ? (f['קטגוריה'] as string[]) : [];
    const categoryName = catIds.length ? (catMap[catIds[0]] ?? '') : '';
    return {
      id: r.id,
      linkId: extractField(f['מזהה קישור']) ?? r.id,
      title: f['כותרת'] ?? '',
      journal: f['כתב עת'] ?? '',
      yeshiva: f['מוסד'] ?? '',
      year: extractField(Array.isArray(f['שנה עברית']) ? (f['שנה עברית'] as unknown[])[0] : f['שנה עברית']) ?? '',
      yearNum: f['שנה לועזית'] ?? 0,
      categories: categoryName ? [categoryName] : [],
      tags: Array.isArray(f['תגיות']) ? f['תגיות'] : [],
      readTime: extractField(f['זמן קריאה']),
      abstract: extractField(f['תקציר']),
      pdfUrl: extractField(f['קישור PDF']),
      keyPoints: extractField(f['נקודות מפתח']),
      sources: extractField(f['מקורות']),
    };
  });
}

function toArticleDetail(record: { id: string; fields: Record<string, unknown> }, linkId: string) {
  const f = record.fields;
  const rawKeyPoints = extractField(f['נקודות מפתח']);
  const keyPoints = rawKeyPoints
    ? rawKeyPoints.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: record.id,
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

    if (linkId) {
      const data = await airtableFetch('מאמרים', {
        filterByFormula: `{מזהה קישור}="${escapeAirtable(linkId)}"`,
        maxRecords: '1',
      });
      const record = data.records[0] ?? null;
      res.statusCode = 200;
      res.end(JSON.stringify(record ? toArticleDetail(record, linkId) : null));
    } else {
      const [articlesData, catsData] = await Promise.all([
        airtableFetch(
          'מאמרים',
          { filterByFormula: `{סטטוס} = "פעיל"` },
          [{ field: 'שנה לועזית', direction: 'desc' }],
        ),
        airtableFetch('קטגוריות', {}),
      ]);
      const catMap: Record<string, string> = {};
      catsData.records.forEach((r) => { catMap[r.id] = (r.fields['שם'] as string) ?? ''; });

      res.statusCode = 200;
      res.end(JSON.stringify(toArticleList(articlesData, catMap)));
    }
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch articles' }));
  }
}
