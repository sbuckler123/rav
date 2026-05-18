import { lazy, type ComponentType } from 'react';

/**
 * Drop-in replacement for React.lazy that recovers from the "stale chunk"
 * scenario that occurs after a new deploy: an old tab's index.js still has
 * the previous hashed filenames burned into its `import()` calls, but those
 * chunks no longer exist on the CDN.
 *
 * On a chunk-load failure we force a one-time page reload so the browser
 * fetches the fresh index.html and the current chunk references. A
 * sessionStorage flag prevents an infinite reload loop if the failure is for
 * some other reason (offline, CDN outage, etc.) — on the second failure we
 * surface the error to the ErrorBoundary.
 */
const RELOAD_KEY = 'rav:chunk-reload';

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk \d+ failed|error loading dynamically imported module/i;

// Matches React's own lazy() signature — ComponentType<any> is required so
// any page (including ones that accept props like { children }) is assignable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await importFn();
      // Successful load — clear the guard so future stale-chunk errors can trigger another reload.
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isChunkError = CHUNK_ERROR_PATTERN.test(message);
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1';

      if (isChunkError && !alreadyReloaded) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        // Keep the lazy suspended forever — the reload replaces the page.
        return new Promise<never>(() => {});
      }
      throw err;
    }
  });
}
