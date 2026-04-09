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

export async function getEvents(): Promise<{ events: EventItem[] }> {
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  const events = await res.json() as EventItem[];
  return { events };
}
