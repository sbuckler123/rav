import { apiFetch } from './apiFetch';

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
  return apiFetch<Category>('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, tables }),
  });
}

export async function renameCategory(id: string, newName: string): Promise<void> {
  await apiFetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
