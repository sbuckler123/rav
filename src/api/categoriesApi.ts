import { apiFetch } from './apiFetch';

export interface Category {
  id: string;
  name: string;
}

export async function fetchCategories(forTable: string): Promise<Category[]> {
  // Admin path: returns rec IDs (required for editing linked-record fields on
  // shiurim/videos/articles, and for mapping the rec IDs that come back from
  // admin GETs of those tables to their display names). Goes through
  // apiFetch so the Clerk admin token is attached.
  return apiFetch<Category[]>(`/api/categories?forTable=${encodeURIComponent(forTable)}&admin=true`);
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
