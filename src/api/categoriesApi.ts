export interface Category {
  id: string;
  name: string;
}

export async function fetchCategories(forTable: string): Promise<Category[]> {
  const res = await fetch(`/api/categories?forTable=${encodeURIComponent(forTable)}`);
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json() as Promise<Category[]>;
}

export async function createCategory(tables: string[], name: string): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, tables }),
  });
  if (!res.ok) throw new Error(`Failed to create category: ${res.status}`);
  return res.json() as Promise<Category>;
}

export async function renameCategory(id: string, newName: string): Promise<void> {
  const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) throw new Error(`Failed to rename category: ${res.status}`);
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete category: ${res.status}`);
}
