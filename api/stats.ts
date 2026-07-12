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
import { airtableRequest, serveCached } from './_publicCache';

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

    // Throws on failure (incl. rate/billing limits) so serveCached can fall
    // back to the last good counts instead of caching a wrong partial total.
    const data = await airtableRequest<{ records: unknown[]; offset?: string }>(
      url.toString(),
      { headers: auth() },
    );
    total += data.records?.length ?? 0;
    offset = data.offset;
    if (!offset) break;
  }

  return total;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!PAT || !BASE_ID) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing config' }));
    return;
  }

  await serveCached(
    res,
    {
      key: 'stats',
      ttlMs: 600_000,
      cacheControl: 's-maxage=600, stale-while-revalidate=86400',
      errorMessage: 'Internal error',
      errorContext: { handler: 'stats' },
    },
    async () => {
      const [shiurim, articles, videos, questions] = await Promise.all([
        countRecords('שיעורים'),
        countRecords('מאמרים', '{סטטוס}="פעיל"'),
        countRecords('שיעורי וידאו'),
        countRecords('שאלות'),
      ]);
      return { shiurim, articles, videos, questions };
    },
  );
}
