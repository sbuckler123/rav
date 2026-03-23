import { airtableFetch } from './airtable';

export interface EventItem {
  id: string;
  slug: string;
  linkId: string;
  title: string;
  eventType: string;
  dateHebrew: string;
  dateLocale: string;
  location: string;
  excerpt: string;
  participantsShort: string[];
  mainImageUrl?: string;
  images: { url: string; order: number }[];
}

function extractField(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value) return String(val.value).trim();
  return undefined;
}

export async function getEvents(): Promise<{ events: EventItem[] }> {
  // Fetch events and gallery records in parallel
  const [eventsData, galleryData] = await Promise.all([
    airtableFetch('אירועים', {}, [{ field: 'תאריך לועזי', direction: 'desc' }]),
    airtableFetch('גלריה', {}),
  ]);

  // Build a map: gallery record id -> { url, order }
  const galleryMap = new Map<string, { url: string; order: number }>();
  for (const r of galleryData.records) {
    const url = extractField(r.fields['URL תמונה']);
    const order = Number(r.fields['סדר']) || 99;
    if (url) galleryMap.set(r.id, { url, order });
  }

  const events: EventItem[] = eventsData.records.map((r: any) => {
    const f = r.fields;

    const rawParticipants = extractField(f['משתתפים']);
    const participantsShort = rawParticipants
      ? rawParticipants.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];

    // גלריה field is an array of linked record IDs
    const linkedGalleryIds: string[] = Array.isArray(f['גלריה']) ? f['גלריה'] : [];
    const images = linkedGalleryIds
      .map((id) => galleryMap.get(id))
      .filter((img): img is { url: string; order: number } => !!img)
      .sort((a, b) => a.order - b.order);

    const mainImageUrl = images.find((img) => img.order === 1)?.url ?? images[0]?.url;

    return {
      id: r.id,
      slug: extractField(f['מזהה URL']) ?? r.id,
      linkId: extractField(f['מזהה קישור']) ?? r.id,
      title: f['כותרת'] ?? '',
      eventType: f['סוג אירוע'] ?? '',
      dateHebrew: f['תאריך עברי'] ?? '',
      dateLocale: f['תאריך לועזי'] ?? '',
      location: f['מיקום'] ?? '',
      excerpt: extractField(f['תקציר קצר']) ?? '',
      participantsShort,
      images,
      mainImageUrl,
    };
  });

  return { events };
}
