import { createHash } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

function sign(params: Record<string, string | number>): string {
  const toSign =
    Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + API_SECRET;
  return createHash('sha1').update(toSign).digest('hex');
}

export async function handle(req: IncomingMessage, res: ServerResponse) {
  if (!API_SECRET || !API_KEY || !CLOUD_NAME) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Cloudinary server config missing' }));
    return;
  }

  const url         = new URL(req.url ?? '/', 'https://placeholder');
  const folderParam = url.searchParams.get('folder');
  const folder      = folderParam ?? process.env.CLOUDINARY_UPLOAD_FOLDER ?? null;

  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { timestamp, type: 'upload' };
  if (folder) params.folder = folder;

  res.statusCode = 200;
  res.end(JSON.stringify({
    timestamp,
    signature: sign(params),
    api_key:    API_KEY,
    cloud_name: CLOUD_NAME,
    folder,
  }));
}
