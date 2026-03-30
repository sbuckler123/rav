/**
 * Vercel Serverless Function — Social Media OG Tag Injection
 *
 * WhatsApp / Facebook / Telegram bots don't execute JavaScript so
 * react-helmet-async never runs for them. vercel.json rewrites
 * /events/:id, /articles/:id, /videos/:id through this function.
 *
 * - Bot request  → fetch the record from Airtable → return OG HTML
 * - Browser request → return dist/index.html so React handles routing
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { readFileSync } from 'fs';
import path from 'path';

// ─── constants ───────────────────────────────────────────────────────────────

const SITE_NAME = 'הרב קלמן מאיר בר';

const DEFAULT_DESC =
  'האתר הרשמי של הרב קלמן מאיר בר, הרב הראשי לישראל. שאלות ותשובות, שיעורי תורה, פסקי הלכה ואירועים.';

const BOT_PATTERN =
  /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|applebot|ia_archiver|vkshare|pinterest/i;

// Airtable table map: URL section → Hebrew table name
const TABLE: Record<string, string> = {
  events:   'אירועים',
  articles: 'מאמרים',
  videos:   'שיעורי וידאו',
  shiurim:  'שיעורים',
};

// ─── index.html (bundled via vercel.json includeFiles) ───────────────────────

let indexHtml: string;
try {
  indexHtml = readFileSync(path.join(process.cwd(), 'dist/index.html'), 'utf-8');
} catch {
  // Fallback: minimal shell that forces a client-side reload to the correct URL
  indexHtml =
    '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<script>window.location.replace(window.location.href)</script></head><body></body></html>';
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractText(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null && 'value' in val)
    return String((val as { value: unknown }).value).trim();
  return '';
}

// ─── Airtable fetch ───────────────────────────────────────────────────────────

async function getOgData(
  section: string,
  id: string,
  baseUrl: string,
): Promise<{ title: string; description: string; image: string; imageWidth: number; imageHeight: number }> {
  const defaultImage = `${baseUrl}/og-image.jpg`;
  const pat    = process.env.VITE_AIRTABLE_PAT;
  const baseId = process.env.VITE_AIRTABLE_BASE_ID;
  const table  = TABLE[section];

  if (!pat || !baseId || !table) {
    return { title: SITE_NAME, description: DEFAULT_DESC, image: defaultImage, imageWidth: 1200, imageHeight: 630 };
  }

  const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
  url.searchParams.set('filterByFormula', `{מזהה קישור}="${id}"`);
  url.searchParams.set('maxRecords', '1');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${pat}` },
  });

  if (!res.ok) return { title: SITE_NAME, description: DEFAULT_DESC, image: defaultImage, imageWidth: 1200, imageHeight: 630 };

  const data = (await res.json()) as {
    records?: { fields: Record<string, unknown> }[];
  };
  const f = data.records?.[0]?.fields;
  if (!f) return { title: SITE_NAME, description: DEFAULT_DESC, image: defaultImage, imageWidth: 1200, imageHeight: 630 };

  const title = extractText(f['כותרת']) || extractText(f['שם']) || SITE_NAME;
  let description = DEFAULT_DESC;
  let image = defaultImage;
  let imageWidth = 1200;
  let imageHeight = 630;

  if (section === 'events') {
    description =
      extractText(f['תיאור']) || extractText(f['תקציר קצר']) || DEFAULT_DESC;
  } else if (section === 'articles') {
    description = extractText(f['תקציר']) || DEFAULT_DESC;
  } else if (section === 'videos') {
    description = extractText(f['תיאור']) || DEFAULT_DESC;
    const ytId = extractText(f['מזהה יוטיוב']).split('&')[0].split('?')[0].trim();
    if (ytId) {
      image = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      imageWidth = 1280;
      imageHeight = 720;
    }
  } else if (section === 'shiurim') {
    description = extractText(f['תיאור']) || DEFAULT_DESC;
  }

  return { title, description, image, imageWidth, imageHeight };
}

// ─── OG HTML builder ─────────────────────────────────────────────────────────

function buildOgHtml(
  title: string,
  description: string,
  image: string,
  pageUrl: string,
  imageWidth = 1200,
  imageHeight = 630,
): string {
  const t = escapeHtml(`${title} | ${SITE_NAME}`);
  const d = escapeHtml(description.slice(0, 160));
  const i = escapeHtml(image);
  const u = escapeHtml(pageUrl);
  const s = escapeHtml(SITE_NAME);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${i}">
<meta property="og:image:width" content="${imageWidth}">
<meta property="og:image:height" content="${imageHeight}">
<meta property="og:url" content="${u}">
<meta property="og:type" content="article">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="${s}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
</head>
<body></body>
</html>`;
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const ua    = (req.headers['user-agent'] ?? '') as string;
  const isBot = BOT_PATTERN.test(ua);

  // Extract the original page path from the ?p= query param
  // e.g. /api/og?p=/events/chief-rabbis-of-israel → pagePath = /events/chief-rabbis-of-israel
  const reqUrl  = new URL(req.url ?? '/', `https://${req.headers.host}`);
  const pagePath = reqUrl.searchParams.get('p') ?? '/';
  const [, section, id] = pagePath.split('/'); // ['', 'events', 'abc123']

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.statusCode = 200;

  if (!isBot) {
    // Regular browser — serve the React SPA shell so client-side routing takes over
    res.end(indexHtml);
    return;
  }

  const proto   = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const host    = (req.headers['x-forwarded-host'] as string | undefined) ?? (req.headers.host as string) ?? '';
  const baseUrl = `${proto}://${host}`;
  const pageUrl = `${baseUrl}${pagePath}`;

  // Social bot — fetch Airtable and return OG HTML
  let ogData = { title: SITE_NAME, description: DEFAULT_DESC, image: `${baseUrl}/og-image.jpg`, imageWidth: 1200, imageHeight: 630 };

  if (section && id) {
    try {
      ogData = await getOgData(section, id, baseUrl);
    } catch {
      // Airtable unreachable — defaults are used
    }
  }

  res.end(buildOgHtml(ogData.title, ogData.description, ogData.image, pageUrl, ogData.imageWidth, ogData.imageHeight));
}
