/**
 * Shared authenticated fetch helper for admin API calls.
 * Automatically attaches the Clerk session token as Authorization: Bearer <token>.
 */

import { getBearerToken } from './tokenStore';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getBearerToken();
  const headers = new Headers(options?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res  = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Error ${res.status}`);
  return data as T;
}
