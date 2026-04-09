export async function getCategories(): Promise<{
  categories: Array<{ id: string; name: string }>;
}> {
  const res = await fetch('/api/categories?forTable=שאלות');
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  const categories = await res.json() as Array<{ id: string; name: string }>;
  return { categories };
}
