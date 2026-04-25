export interface EventDetail {
  linkId: string;
  title: string;
  eventType: string;
  dateHebrew: string;
  dateLocale: string;
  location: string;
  duration: string;
  teurDescription: string;
  description: string;
  gallery: { url: string; caption: string; order: number }[];
  quotes: { text: string; author: string }[];
  schedule: { time: string; description: string }[];
}

export async function getEventByLinkId(linkId: string): Promise<EventDetail | null> {
  const res = await fetch(`/api/events?linkId=${encodeURIComponent(linkId)}`);
  if (!res.ok) throw new Error(`Failed to fetch event: ${res.status}`);
  return res.json() as Promise<EventDetail | null>;
}
