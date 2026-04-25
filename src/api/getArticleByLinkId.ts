export interface ArticleDetail {
  linkId: string;
  title: string;
  journal: string;
  yeshiva: string;
  yearHebrew: string;
  yearEnglish: string;
  categories: string[];
  tags: string[];
  readTime?: string;
  abstract?: string;
  fullContent?: string;
  pdfUrl?: string;
  keyPoints: string[];
  sources?: string;
}

export async function getArticleByLinkId(linkId: string): Promise<ArticleDetail | null> {
  const res = await fetch(`/api/articles?linkId=${encodeURIComponent(linkId)}`);
  if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`);
  return res.json() as Promise<ArticleDetail | null>;
}
