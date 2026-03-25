import { airtableFetch } from './airtable';

export interface ArticleDetail {
  id: string;
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

function extractField(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value) return String(val.value).trim();
  return undefined;
}

export async function getArticleByLinkId(linkId: string): Promise<ArticleDetail | null> {
  const data = await airtableFetch('מאמרים');

  const record = data.records.find((r: any) => {
    const raw = r.fields['מזהה קישור'];
    const id = extractField(raw) ?? r.id;
    return id === linkId;
  });

  if (!record) return null;

  const f = record.fields;

  const rawKeyPoints = extractField(f['נקודות מפתח']);
  const keyPoints = rawKeyPoints
    ? rawKeyPoints.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return {
    id: record.id,
    linkId,
    title: f['כותרת'] ?? '',
    journal: f['כתב עת'] ?? '',
    yeshiva: f['מוסד'] ?? '',
    yearHebrew: f['שנה עברית'] ?? '',
    yearEnglish: String(f['שנה לועזית'] ?? ''),
    categories: Array.isArray(f['קטגוריות']) ? f['קטגוריות'] : (f['קטגוריות'] ? [f['קטגוריות']] : []),
    tags: Array.isArray(f['תגיות']) ? f['תגיות'] : (f['תגיות'] ? [f['תגיות']] : []),
    readTime: extractField(f['זמן קריאה']),
    abstract: extractField(f['תקציר']),
    fullContent: extractField(f['תוכן מלא']),
    pdfUrl: extractField(f['קישור PDF']),
    keyPoints,
    sources: extractField(f['מקורות']),
  };
}
