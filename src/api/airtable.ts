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
    body: JSON.stringify({ fields, typecast: true }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Airtable error:', res.status, body);
    throw new Error(body?.error?.message ?? `Airtable error: ${res.status}`);
  }

  return res.json();
}

export async function airtableUpdate(table: string, recordId: string, fields: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(table)}/${recordId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields, typecast: true }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Airtable error:', res.status, body);
    throw new Error(body?.error?.message ?? `Airtable error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetches the choices for a single-select or multi-select field via the Airtable Meta API.
 * Returns an array of choice name strings in the order defined in Airtable.
 */
export async function airtableGetFieldChoices(
  tableName: string,
  fieldName: string
): Promise<string[]> {
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
    { headers }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Airtable meta error:', res.status, body);
    throw new Error(`Airtable meta error: ${res.status}`);
  }

  const data = await res.json();
  const table = data.tables?.find((t: any) => t.name === tableName);
  if (!table) return [];

  const field = table.fields?.find((f: any) => f.name === fieldName);
  if (!field?.options?.choices) return [];

  return field.options.choices.map((c: any) => c.name as string);
}

export async function airtableDelete(table: string, recordId: string) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(table)}/${recordId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Airtable error: ${res.status}`);
  }

  return res.json();
}
