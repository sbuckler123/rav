import { airtableFetch, airtableCreate, airtableUpdate, airtableDelete } from './airtable';

export interface Category {
  id: string;
  name: string;
}

const TABLE = 'קטגוריות';

/** Fetch all active categories that include the given content table in their טבלה field. */
export async function fetchCategories(forTable: string): Promise<Category[]> {
  const data = await airtableFetch(
    TABLE,
    { filterByFormula: `AND({סטטוס}='פעיל',FIND('${forTable}',ARRAYJOIN({טבלה})))` },
    [{ field: 'שם', direction: 'asc' }]
  );
  return data.records.map((r: any) => ({
    id: r.id,
    name: r.fields['שם'] ?? '',
  }));
}

/** Create a new category associated with one or more content tables. */
export async function createCategory(tables: string[], name: string): Promise<Category> {
  const record = await airtableCreate(TABLE, {
    'שם': name.trim(),
    'סטטוס': 'פעיל',
    'טבלה': tables,
  });
  return { id: record.id, name: name.trim() };
}

/**
 * Rename a category. Because content tables use linked records,
 * the new name is reflected everywhere automatically — no batch update needed.
 */
export async function renameCategory(id: string, newName: string): Promise<void> {
  await airtableUpdate(TABLE, id, { 'שם': newName.trim() });
}

/** Delete a category record. */
export async function deleteCategory(id: string): Promise<void> {
  await airtableDelete(TABLE, id);
}
