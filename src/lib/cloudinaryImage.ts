/**
 * Inserts Cloudinary delivery transformations into a stored URL so the
 * browser receives a properly sized, modern-format (WebP/AVIF), auto-quality
 * image instead of the original upload.
 *
 * Pass-through for non-Cloudinary URLs (YouTube thumbnails, fillout.com,
 * static assets, data: URLs).
 *
 * Use `width` to cap the largest dimension; smaller-than-requested originals
 * are not upscaled (c_limit).
 */
export function cldOptimize(url: string, width?: number): string;
export function cldOptimize(url: undefined, width?: number): undefined;
export function cldOptimize(url: string | undefined, width?: number): string | undefined;
export function cldOptimize(url: string | undefined, width?: number): string | undefined {
  if (!url || !url.includes('res.cloudinary.com')) return url;

  // Idempotent — bail if a transformation segment is already present.
  if (/\/image\/upload\/[^/]*(f_auto|q_auto|w_\d+)/.test(url)) return url;

  const params: string[] = ['f_auto', 'q_auto'];
  if (width) {
    params.push(`w_${width}`, 'c_limit');
  }

  return url.replace('/image/upload/', `/image/upload/${params.join(',')}/`);
}
