/**
 * Shared request-body reader with explicit byte cap.
 *
 * Standardized limits — pick the smallest one that fits the payload:
 *   - SMALL  ≈ 10 KB   metadata-only writes (settings, simple PATCH)
 *   - MEDIUM ≈ 50 KB   typical CRUD bodies
 *   - LARGE  ≈ 250 KB  rich content (al-haperek blocks, long answers)
 */

import type { IncomingMessage } from 'http';

export const BODY_LIMITS = {
  SMALL:  10_000,
  MEDIUM: 50_000,
  LARGE:  250_000,
} as const;

export function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error('Request body too large'));
        return;
      }
      data += chunk.toString();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
