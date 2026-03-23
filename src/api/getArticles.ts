import { airtableFetch } from './airtable';

export interface Article {
  id: string;
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

function extractField(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value) return String(val.value).trim();
  return undefined;
}

export async function getArticles(): Promise<{ articles: Article[] }> {
  const data = await airtableFetch(
    'מאמרים',
    {},
    [{ field: 'שנה לועזית', direction: 'desc' }]
  );

  const articles: Article[] = data.records.map((r: any) => {
    const f = r.fields;
    return {
      id: r.id,
      linkId: extractField(f['מזהה קישור']) ?? r.id,
      title: f['כותרת'] ?? '',
      journal: f['כתב עת'] ?? '',
      yeshiva: f['מוסד'] ?? '',
      year: extractField(Array.isArray(f['שנה עברית']) ? f['שנה עברית'][0] : f['שנה עברית']) ?? '',
      yearNum: f['שנה לועזית'] ?? 0,
      categories: f['קטגוריות'] ?? [],
      tags: f['תגיות'] ?? [],
      readTime: extractField(f['זמן קריאה']),
      abstract: extractField(f['תקציר']),
      pdfUrl: extractField(f['קישור PDF']),
      keyPoints: extractField(f['נקודות מפתח']),
      sources: extractField(f['מקורות']),
    };
  });

  return { articles };
}
