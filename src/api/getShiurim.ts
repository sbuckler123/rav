import { airtableFetch } from './airtable';

export interface ShiurEvent {
  id: string;
  linkId: string;
  title: string;
  date: string;      // DD.MM.YYYY for display
  dateRaw: string;   // raw value for filtering
  time: string;
  location: string;
  description: string;
  category: string;
}

function extractField(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value) return String(val.value).trim();
  return undefined;
}

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export async function getShiurim(): Promise<{ shiurim: ShiurEvent[] }> {
  const [shiurimData, catsData] = await Promise.all([
    airtableFetch('שיעורים', {}, [{ field: 'תאריך', direction: 'asc' }]),
    airtableFetch('קטגוריות', {}),
  ]);

  const catMap: Record<string, string> = {};
  catsData.records.forEach((r: any) => { catMap[r.id] = r.fields['שם'] ?? ''; });

  const shiurim: ShiurEvent[] = shiurimData.records.map((r: any) => {
    const f = r.fields;
    const dateRaw = f['תאריך'] ?? '';
    const catIds: string[] = f['קטגוריה'] ?? [];
    return {
      id: r.id,
      linkId: extractField(f['מזהה קישור']) ?? r.id,
      title: extractField(f['כותרת']) ?? extractField(f['שם']) ?? '',
      date: formatDate(dateRaw),
      dateRaw,
      time: extractField(f['שעה']) ?? extractField(f['זמן']) ?? '',
      location: extractField(f['מיקום']) ?? '',
      description: extractField(f['תיאור']) ?? '',
      category: catIds.length ? (catMap[catIds[0]] ?? '') : '',
    };
  });

  return { shiurim };
}
