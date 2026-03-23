import { airtableFetch } from './airtable';

export async function getCategories(): Promise<{
  categories: Array<{ id: string; name: string }>;
}> {
  const data = await airtableFetch('קטגוריות', {
    filterByFormula: "{סטטוס}='פעיל'",
  });
  const categories = data.records.map((r: any) => ({
    id: r.id,
    name: r.fields['שם'] ?? '',
  }));
  return { categories };
}
