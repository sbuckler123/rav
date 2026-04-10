/**
 * Vercel Serverless Function — Public stats
 *
 * GET /api/stats → { shiurim, articles, videos, questions }
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const auth = () => ({ Authorization: `Bearer ${PAT}` });

async function countRecords(table: string, filterByFormula?: string): Promise<number> {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
  url.searchParams.set('fields[0]', 'מזהה קישור');
  url.searchParams.set('maxRecords', '100');
  if (filterByFormula) url.searchParams.set('filterByFormula', filterByFormula);
  const res = await fetch(url.toString(), { headers: auth() });
  if (!res.ok) return 0;
  const data = await res.json() as { records: unknown[] };
  return data.records?.length ?? 0;
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
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
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.statusCode = 500;
    res.end(JSON.stringify({ error: msg }));
  }
}
