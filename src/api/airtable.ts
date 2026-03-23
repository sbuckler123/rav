const PAT = import.meta.env.VITE_AIRTABLE_PAT;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

const headers = {
  Authorization: `Bearer ${PAT}`,
  'Content-Type': 'application/json',
};

export interface SortParam {
  field: string;
  direction?: 'asc' | 'desc';
}

export async function airtableFetch(
  table: string,
  params: Record<string, string> = {},
  sort?: SortParam[]
) {
  const url = new URL(`${BASE_URL}/${encodeURIComponent(table)}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  // Airtable expects sort as: sort[0][field]=... &sort[0][direction]=...
  if (sort) {
    sort.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
    });
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Airtable error:', res.status, body);
    throw new Error(body?.error?.message ?? `Airtable error: ${res.status}`);
  }

  return res.json();
}

export async function airtableCreate(table: string, fields: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Airtable error:', res.status, body);
    throw new Error(body?.error?.message ?? `Airtable error: ${res.status}`);
  }

  return res.json();
}
