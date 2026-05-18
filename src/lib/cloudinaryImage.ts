/**
 * Inserts Cloudinary delivery transformations into a stored URL so the
 * browser receives a properly sized, modern-format (WebP/AVIF), auto-quality
 * image instead of the original upload.
 *
 * - `cldOptimize(url)`              → f_auto,q_auto only (no resize)
 * - `cldOptimize(url, w)`           → also caps width; portrait images stay tall
 *                                     (c_limit, no upscale)
 * - `cldOptimize(url, w, h)`        → resize-and-crop to exact width/height with
 *                                     AI-picked focal point (c_fill,g_auto).
 *                                     Use when the slot has a fixed aspect.
 *
 * Pass-through for non-Cloudinary URLs (YouTube thumbnails, static assets,
 * data: URIs).
 */
export function cldOptimize(url: string, width?: number, height?: number): string;
export function cldOptimize(url: undefined, width?: number, height?: number): undefined;
export function cldOptimize(url: string | undefined, width?: number, height?: number): string | undefined;
export function cldOptimize(url: string | undefined, width?: number, height?: number): string | undefined {
  if (!url || !url.includes('res.cloudinary.com')) return url;

  // Idempotent — bail if a transformation segment is already present.
  if (/\/image\/upload\/[^/]*(f_auto|q_auto|w_\d+|c_fill|c_limit)/.test(url)) return url;

  const params: string[] = ['f_auto', 'q_auto'];
  if (width && height) {
    params.push(`w_${width}`, `h_${height}`, 'c_fill', 'g_auto');
  } else if (width) {
    params.push(`w_${width}`, 'c_limit');
  }

  return url.replace('/image/upload/', `/image/upload/${params.join(',')}/`);
}
