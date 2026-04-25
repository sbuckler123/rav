export interface Article {
  linkId: string;
  title: string;
  journal: string;
  yeshiva: string;
  year: string;
  yearNum: number;
  categories: string[];
  tags: string[];
  readTime?: string;
  abstract?: string;
  pdfUrl?: string;
  keyPoints?: string;
  sources?: string;
}

export async function getArticles(): Promise<{ articles: Article[] }> {
  const res = await fetch('/api/articles');
  if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`);
  const articles = await res.json() as Article[];
  return { articles };
}
