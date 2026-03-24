import { airtableFetch } from './airtable';

export interface ShiurItem {
  id: string;
  linkId: string;
  title: string;
  date: string;       // DD.MM.YYYY for display
  dateRaw: string;    // YYYY-MM-DD for filtering
  duration: string;
  description: string;
  category: string;
  videoType: 'youtube' | 'direct' | '';
  youtubeId: string;
  videoUrl: string;
  thumbnail: string;
  views: number;
  isNew: boolean;
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

export async function getVideos(): Promise<{ shiurim: ShiurItem[] }> {
  const data = await airtableFetch(
    'שיעורי וידאו',
    { filterByFormula: `{סטטוס} = "פעיל"` },
    [{ field: 'תאריך', direction: 'desc' }]
  );

  const shiurim: ShiurItem[] = data.records.map((r: any) => {
    const f = r.fields;
    const dateRaw = f['תאריך'] ?? '';
    return {
      id: r.id,
      linkId: extractField(f['מזהה קישור']) ?? r.id,
      title: f['כותרת'] ?? '',
      date: formatDate(dateRaw),
      dateRaw,
      duration: f['משך'] ?? '',
      description: extractField(f['תיאור']) ?? '',
      category: f['קטגוריה'] ?? '',
      videoType: f['סוג סרטון'] ?? '',
      youtubeId: (f['מזהה יוטיוב'] ?? '').split('&')[0].split('?')[0].trim(),
      videoUrl: f['קישור סרטון'] ?? '',
      thumbnail: f['תמונה ממוזערת'] ?? '',
      views: f['צפיות'] ?? 0,
      isNew: f['חדש'] ?? false,
    };
  });

  return { shiurim };
}
