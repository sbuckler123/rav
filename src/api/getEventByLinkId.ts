import { airtableFetch } from './airtable';

export interface EventDetail {
  id: string;
  linkId: string;
  slug: string;
  title: string;
  eventType: string;
  dateHebrew: string;
  dateLocale: string;
  location: string;
  duration: string;
  teurDescription: string;
  description: string;
  participants: string[];
  gallery: { url: string; caption: string; order: number }[];
  quotes: { text: string; author: string }[];
  schedule: { time: string; description: string }[];
}

function extractField(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value) return String(val.value).trim();
  return undefined;
}

export async function getEventByLinkId(linkId: string): Promise<EventDetail | null> {
  const [eventsData, galleryData] = await Promise.all([
    airtableFetch('אירועים', {}),
    airtableFetch('גלריה', {}),
  ]);

  // Build gallery map: record id -> { url, caption, order }
  const galleryMap = new Map<string, { url: string; caption: string; order: number }>();
  for (const r of galleryData.records) {
    const url = extractField(r.fields['URL תמונה']);
    if (url) {
      galleryMap.set(r.id, {
        url,
        caption: extractField(r.fields['כיתוב']) ?? '',
        order: Number(r.fields['סדר']) || 99,
      });
    }
  }

  // Find the event matching the linkId
  const record = eventsData.records.find(
    (r: any) => extractField(r.fields['מזהה קישור']) === linkId
  );
  if (!record) return null;

  const f = record.fields;

  const rawParticipants = extractField(f['משתתפים']);
  const participants = rawParticipants
    ? rawParticipants.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const linkedGalleryIds: string[] = Array.isArray(f['גלריה']) ? f['גלריה'] : [];
  const gallery = linkedGalleryIds
    .map((id) => galleryMap.get(id))
    .filter((img): img is { url: string; caption: string; order: number } => !!img)
    .sort((a, b) => a.order - b.order);

  // Quotes — expects a newline-separated "text|author" format or just text
  const rawQuotes = extractField(f['ציטוטים']);
  const quotes = rawQuotes
    ? rawQuotes.split('\n').map((line: string) => {
        const [text, author = ''] = line.split('|');
        return { text: text.trim(), author: author.trim() };
      }).filter((q: { text: string }) => q.text)
    : [];

  // Schedule — expects "HH:MM פעילות" per line
  const rawSchedule = extractField(f['לוח זמנים']);
  const schedule = rawSchedule
    ? rawSchedule.split('\n').map((line: string) => {
        const match = line.match(/^(\S+)\s+(.+)$/);
        return match
          ? { time: match[1], description: match[2].trim() }
          : { time: '', description: line.trim() };
      }).filter((s: { description: string }) => s.description)
    : [];

  return {
    id: record.id,
    linkId,
    slug: extractField(f['מזהה URL']) ?? record.id,
    title: f['כותרת'] ?? '',
    eventType: f['סוג אירוע'] ?? '',
    dateHebrew: f['תאריך עברי'] ?? '',
    dateLocale: f['תאריך לועזי'] ?? '',
    location: f['מיקום'] ?? '',
    duration: f['משך'] ?? '',
    teurDescription: extractField(f['תיאור']) ?? '',
    description: extractField(f['תיאור מלא']) ?? extractField(f['תקציר קצר']) ?? '',
    participants,
    gallery,
    quotes,
    schedule,
  };
}
