export interface ShiurEvent {
  id: string;
  linkId: string;
  title: string;
  date: string;
  dateRaw: string;
  time: string;
  location: string;
  description: string;
  category: string;
}

export async function getShiurim(): Promise<{ shiurim: ShiurEvent[] }> {
  const res = await fetch('/api/shiurim');
  if (!res.ok) throw new Error(`Failed to fetch shiurim: ${res.status}`);
  const shiurim = await res.json() as ShiurEvent[];
  return { shiurim };
}
