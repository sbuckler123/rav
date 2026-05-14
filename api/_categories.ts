/**
 * Shared category-map reader with an in-memory TTL cache.
 *
 * The קטגוריות table changes rarely but was previously re-fetched on every
 * articles/videos/shiurim cache miss. Caching it for 10 min — and coalescing
 * concurrent callers within a warm instance into one fetch — removes one
 * Airtable call from each of those misses.
 */

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const TTL_MS = 10 * 60_000;

let cache: { map: Record<string, string>; expiresAt: number } | null = null;
let inFlight: Promise<Record<string, string>> | null = null;

async function fetchCategoryMap(): Promise<Record<string, string>> {
  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('קטגוריות')}`,
  );
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  const data = (await res.json()) as {
    records: { id: string; fields: Record<string, unknown> }[];
  };
  const map: Record<string, string> = {};
  data.records.forEach((r) => { map[r.id] = (r.fields['שם'] as string) ?? ''; });
  return map;
}

/** Returns an id→name map of all categories, cached in-memory for 10 min. */
export async function getCategoryMap(): Promise<Record<string, string>> {
  if (cache && cache.expiresAt > Date.now()) return cache.map;
  if (inFlight) return inFlight;

  inFlight = fetchCategoryMap()
    .then((map) => {
      cache = { map, expiresAt: Date.now() + TTL_MS };
      return map;
    })
    .finally(() => { inFlight = null; });

  return inFlight;
}
