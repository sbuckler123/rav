import { getBearerToken } from './tokenStore';
import { captureApiError } from '@/lib/sentry';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getBearerToken();
  const headers = new Headers(options?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (networkErr) {
    captureApiError(networkErr as Error, { url: path, method: options?.method ?? 'GET' });
    throw networkErr;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { error?: string }).error ?? `HTTP ${res.status}`;
    const error = new Error(message);
    // 401 = expected (session expired) — don't pollute Sentry
    if (res.status !== 401) {
      captureApiError(error, {
        url: path,
        method: options?.method ?? 'GET',
        status: res.status,
        response: data,
      });
    }
    throw error;
  }

  return data as T;
}
