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
const SITE_URL  = 'https://www.haravkalmanber.co.il';

const DEFAULT_DESC =
  'האתר הרשמי של הרב קלמן מאיר בר, הרב הראשי לישראל. שאלות ותשובות, שיעורי תורה, פסקי הלכה ואירועים.';

const BOT_PATTERN =
  /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|applebot|ia_archiver|vkshare|pinterest/i;

// Airtable table map: URL section → Hebrew table name.
// Keys are the real public route slugs (matched against the first path segment).
const TABLE: Record<string, string> = {
  'shiurei-torah': 'שיעורי וידאו',
  'luach-iruyim':  'שיעורים',
  'hagut-upsika':  'מאמרים',
  'idkunim':       'על הפרק',
};

// ─── sitemap: static + dynamic config ───────────────────────────────────────

type SitemapImage = { loc: string; caption?: string };
type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  images?: SitemapImage[];
};

const STATIC_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/',               priority: '1.0', changefreq: 'weekly'  },
  { path: '/odot',           priority: '0.8', changefreq: 'monthly' },
  { path: '/shut',           priority: '0.9', changefreq: 'daily'   },
  { path: '/shaal-et-harav', priority: '0.7', changefreq: 'monthly' },
  { path: '/shiurei-torah',  priority: '0.9', changefreq: 'weekly'  },
  { path: '/luach-iruyim',   priority: '0.8', changefreq: 'weekly'  },
  { path: '/hagut-upsika',   priority: '0.8', changefreq: 'weekly'  },
  { path: '/idkunim',        priority: '0.8', changefreq: 'weekly'  },
  { path: '/accessibility',  priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy',        priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies',        priority: '0.3', changefreq: 'yearly' },
  { path: '/terms',          priority: '0.3', changefreq: 'yearly' },
];

// IMPORTANT: only canonical URL paths belong here. /al-haperek/* is 308-redirected
// to /idkunim/* in vercel.json, so the 'על הפרק' table must publish under /idkunim.
// Emitting /al-haperek/* URLs would create avoidable redirect chains for Googlebot.
const DYNAMIC_SOURCES: {
  table: string;
  prefix: string;
  filter: string;
  imageField?: string;     // direct image URL
  youtubeIdField?: string; // YouTube ID — derives a thumbnail URL
}[] = [
  { table: 'שיעורי וידאו', prefix: '/shiurei-torah', filter: '{סטטוס} = "פעיל"',  youtubeIdField: 'מזהה יוטיוב' },
  { table: 'שיעורים',      prefix: '/luach-iruyim',  filter: '{סטטוס} = "פעיל"'  },
  { table: 'מאמרים',        prefix: '/hagut-upsika',  filter: '{סטטוס} = "פעיל"'  },
  { table: 'על הפרק',       prefix: '/idkunim',       filter: '{סטטוס} = "פורסם"', imageField: 'תמונת כותרת' },
];

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
  const pat    = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = TABLE[section];

  if (!pat || !baseId || !table) {
    return { title: SITE_NAME, description: DEFAULT_DESC, image: defaultImage, imageWidth: 1200, imageHeight: 630 };
  }

  const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
  const safeId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  url.searchParams.set('filterByFormula', `{מזהה קישור}="${safeId}"`);
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

  if (section === 'hagut-upsika') {
    description = extractText(f['תקציר']) || DEFAULT_DESC;
  } else if (section === 'shiurei-torah') {
    description = extractText(f['תיאור']) || DEFAULT_DESC;
    const ytId = extractText(f['מזהה יוטיוב']).split('&')[0].split('?')[0].trim();
    if (ytId) {
      image = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      imageWidth = 1280;
      imageHeight = 720;
    }
  } else if (section === 'luach-iruyim') {
    description = extractText(f['תיאור']) || DEFAULT_DESC;
  } else if (section === 'idkunim') {
    description = extractText(f['תקציר']) || DEFAULT_DESC;
    const cover = extractText(f['תמונת כותרת']);
    if (cover) {
      // Force 1200×630 for proper social-share rendering when the cover is on Cloudinary.
      image = cover.includes('res.cloudinary.com') && cover.includes('/image/upload/')
        ? cover.replace('/image/upload/', '/image/upload/c_fill,w_1200,h_630,g_auto,f_jpg,q_auto/')
        : cover;
    }
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

// ─── sitemap helpers ─────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchSitemapRows(
  table: string,
  filter: string,
  opts: { imageField?: string; youtubeIdField?: string } = {},
): Promise<{ linkId: string; lastmod: string; imageUrl?: string }[]> {
  const pat    = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) return [];

  const all: { linkId: string; lastmod: string; imageUrl?: string }[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.append('fields[]', 'מזהה קישור');
    if (opts.imageField) url.searchParams.append('fields[]', opts.imageField);
    if (opts.youtubeIdField) url.searchParams.append('fields[]', opts.youtubeIdField);
    url.searchParams.set('filterByFormula', filter);
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${pat}` } });
    if (!res.ok) break;

    const data = (await res.json()) as {
      records?: { id: string; createdTime?: string; fields: Record<string, unknown> }[];
      offset?: string;
    };

    for (const r of data.records ?? []) {
      // Skip rows without a real public link id — fallback to internal Airtable
      // record ids would (a) 404 in the React app and (b) leak internal ids.
      const linkId = extractText(r.fields['מזהה קישור']);
      if (!linkId) continue;
      const lastmod = (r.createdTime ?? new Date().toISOString()).slice(0, 10);

      let imageUrl: string | undefined;
      if (opts.imageField) {
        const v = r.fields[opts.imageField];
        if (typeof v === 'string' && v.startsWith('http')) imageUrl = v;
      } else if (opts.youtubeIdField) {
        const yt = extractText(r.fields[opts.youtubeIdField]).split('&')[0].split('?')[0].trim();
        if (yt) imageUrl = `https://img.youtube.com/vi/${yt}/maxresdefault.jpg`;
      }

      all.push({ linkId, lastmod, imageUrl });
    }
    offset = data.offset;
  } while (offset);

  return all;
}

function renderSitemap(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const lines = [
        '  <url>',
        `    <loc>${escapeXml(e.loc)}</loc>`,
        `    <lastmod>${e.lastmod}</lastmod>`,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
      ];
      for (const img of e.images ?? []) {
        lines.push('    <image:image>');
        lines.push(`      <image:loc>${escapeXml(img.loc)}</image:loc>`);
        if (img.caption) lines.push(`      <image:caption>${escapeXml(img.caption)}</image:caption>`);
        lines.push('    </image:image>');
      }
      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`;
}

async function handleSitemap(res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const today = new Date().toISOString().slice(0, 10);
  const entries: SitemapEntry[] = STATIC_ROUTES.map((r) => ({
    loc: `${SITE_URL}${r.path}`,
    lastmod: today,
    changefreq: r.changefreq,
    priority: r.priority,
  }));

  const dynamicResults = await Promise.all(
    DYNAMIC_SOURCES.map((s) =>
      fetchSitemapRows(s.table, s.filter, {
        imageField: s.imageField,
        youtubeIdField: s.youtubeIdField,
      }).catch(() => []),
    ),
  );

  DYNAMIC_SOURCES.forEach((source, i) => {
    for (const row of dynamicResults[i]) {
      entries.push({
        loc: `${SITE_URL}${source.prefix}/${encodeURIComponent(row.linkId)}`,
        lastmod: row.lastmod,
        changefreq: 'weekly',
        priority: '0.7',
        images: row.imageUrl ? [{ loc: row.imageUrl }] : undefined,
      });
    }
  });

  // Defensive: drop any URL that would land on a 308 redirect path. Currently
  // none of the DYNAMIC_SOURCES uses /al-haperek (the legacy prefix), but
  // guarding here prevents future entries from emitting redirect chains.
  const filtered = entries.filter((e) => !e.loc.includes('/al-haperek'));

  res.statusCode = 200;
  res.end(renderSitemap(filtered));
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const reqUrl  = new URL(req.url ?? '/', `https://${req.headers.host}`);

  // Sitemap branch — served via vercel.json rewrite /sitemap.xml → /api/og?sitemap=1
  if (reqUrl.searchParams.get('sitemap') === '1') {
    // Reject any extra query params — they fragment the CDN cache and let an
    // attacker force fresh Airtable fetches by varying the query string.
    // Redirect to the canonical /sitemap.xml so legitimate clients still land
    // on the right place.
    const params = [...reqUrl.searchParams.keys()];
    if (params.length !== 1 || params[0] !== 'sitemap') {
      res.statusCode = 308;
      res.setHeader('Location', '/sitemap.xml');
      res.end();
      return;
    }
    await handleSitemap(res);
    return;
  }

  const ua    = (req.headers['user-agent'] ?? '') as string;
  const isBot = BOT_PATTERN.test(ua);

  // Extract the original page path from the ?p= query param
  // e.g. /api/og?p=/events/chief-rabbis-of-israel → pagePath = /events/chief-rabbis-of-israel
  const pagePath = reqUrl.searchParams.get('p') ?? '/';
  const [, section, id] = pagePath.split('/'); // ['', 'events', 'abc123']

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.statusCode = 200;

  if (!isBot) {
    // Regular browser — serve the React SPA shell so client-side routing takes over
    res.end(indexHtml);
    return;
  }

  // Bot-only OG shell must not be indexed — search engines should crawl the
  // canonical SPA URL, not this preview surface.
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

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
