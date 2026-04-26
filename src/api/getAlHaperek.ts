export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'video'; url: string; caption?: string }
  | { type: 'images'; urls: string[]; caption?: string }
  | { type: 'pdf'; url: string; label?: string };

export interface AlHaperekItem {
  linkId: string;
  title: string;
  summary?: string;
  coverImage?: string;
  categoryId?: string;
  tags: string[];
  date?: string;
  blocks: ContentBlock[];
}

export async function getAlHaperekList(): Promise<{ items: AlHaperekItem[] }> {
  const res = await fetch('/api/al-haperek');
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

export async function getAlHaperekItem(linkId: string): Promise<AlHaperekItem | null> {
  const res = await fetch(`/api/al-haperek?linkId=${encodeURIComponent(linkId)}`);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}
