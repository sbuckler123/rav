/**
 * Module-level store for Clerk's getToken function.
 * Registered once from AuthContext; read by apiFetch on every request.
 */

type TokenGetter = () => Promise<string | null>;

let _getToken: TokenGetter | null = null;

export function registerTokenGetter(fn: TokenGetter): void {
  _getToken = fn;
}

export async function getBearerToken(): Promise<string | null> {
  if (!_getToken) return null;
  return _getToken();
}
