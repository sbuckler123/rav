import { airtableFetch } from './airtable';

export async function getCategories(): Promise<{
  categories: Array<{ id: string; name: string }>;
}> {
  const data = await airtableFetch('קטגוריות', {
    filterByFormula: `AND({סטטוס}='פעיל',FIND('שאלות',ARRAYJOIN({טבלה})))`,
  });
  const categories = data.records.map((r: any) => ({
    id: r.id,
    name: r.fields['שם'] ?? '',
  }));
  return { categories };
}
