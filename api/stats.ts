/**
 * Vercel Serverless Function — Public stats
 *
 * GET /api/stats → { shiurim, articles, videos, questions }
 *
 * Counts are computed by paginating Airtable's list endpoint (no native
 * count API). A hard page cap prevents runaway loops; results are cached
 * at the CDN for 5 minutes so this isn't called per page-view.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { captureServerError } from './_sentry';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const PAGE_SIZE = 100;
const MAX_PAGES = 100;  // safety: 10 000 records max per table

const auth = () => ({ Authorization: `Bearer ${PAT}` });

async function countRecords(table: string, filterByFormula?: string): Promise<number> {
  let total = 0;
  let offset: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
    url.searchParams.set('fields[0]', 'מזהה קישור');  // minimize bandwidth
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    if (filterByFormula) url.searchParams.set('filterByFormula', filterByFormula);
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers: auth() });
    if (!res.ok) return total;

    const data = await res.json() as { records: unknown[]; offset?: string };
    total += data.records?.length ?? 0;
    offset = data.offset;
    if (!offset) break;
  }

  return total;
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  try {
    const [shiurim, articles, videos, questions] = await Promise.all([
      countRecords('שיעורים'),
      countRecords('מאמרים', '{סטטוס}="פעיל"'),
      countRecords('שיעורי וידאו'),
      countRecords('שאלות'),
    ]);
    res.statusCode = 200;
    res.end(JSON.stringify({ shiurim, articles, videos, questions }));
  } catch (err) {
    captureServerError(err, { handler: 'stats' });
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
}
