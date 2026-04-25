export interface ShiurItem {
  linkId: string;
  title: string;
  date: string;
  dateRaw: string;
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

export async function getVideos(): Promise<{ shiurim: ShiurItem[] }> {
  const res = await fetch('/api/videos');
  if (!res.ok) throw new Error(`Failed to fetch videos: ${res.status}`);
  const shiurim = await res.json() as ShiurItem[];
  return { shiurim };
}
