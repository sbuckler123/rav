export async function getCategories(): Promise<{
  categories: Array<{ name: string }>;
}> {
  const res = await fetch('/api/categories?forTable=שאלות');
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  const categories = await res.json() as Array<{ name: string }>;
  return { categories };
}
