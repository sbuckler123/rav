/**
 * Vercel Edge Middleware — Social Media OG Tag Injection
 *
 * WhatsApp, Facebook, Telegram and other bots do not execute JavaScript,
 * so react-helmet-async never runs for them. This middleware intercepts
 * bot requests to dynamic content pages, fetches the record from Airtable,
 * and returns a minimal HTML page with the correct Open Graph meta tags.
 *
 * Regular browser traffic is passed through unchanged.
 */

export const config = {
  matcher: ['/events/:path+', '/articles/:path+', '/videos/:path+'],
};

// Social media / link-preview bots
const BOT_PATTERN =
  /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|applebot|ia_archiver|vkshare|pinterest/i;

const SITE_NAME = 'הרב קלמן מאיר בר';
const DEFAULT_IMAGE =
  'https://images.fillout.com/orgid-590181/flowpublicid-bjqtmvgzna/widgetid-default/fbWdZYpc2d4y4e6G4p1wmf/pasted-image-1770841682409.jpg';
const DEFAULT_DESC =
  'האתר הרשמי של הרב קלמן מאיר בר, הרב הראשי לישראל. שאלות ותשובות, שיעורי תורה, פסקי הלכה ואירועים.';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractText(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null && 'value' in val)
    return String((val as { value: unknown }).value).trim();
  return '';
}

async function airtableFetch(
  table: string,
  filterFormula: string
): Promise<Record<string, unknown> | null> {
  const pat = process.env.VITE_AIRTABLE_PAT;
  const baseId = process.env.VITE_AIRTABLE_BASE_ID;
  if (!pat || !baseId) return null;

  const url = new URL(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`
  );
  url.searchParams.set('filterByFormula', filterFormula);
  url.searchParams.set('maxRecords', '1');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${pat}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { records?: { fields: Record<string, unknown> }[] };
  return data.records?.[0]?.fields ?? null;
}

function buildHtml(
  title: string,
  description: string,
  image: string,
  pageUrl: string
): string {
  const fullTitle = escapeHtml(`${title} | ${SITE_NAME}`);
  const safeDesc = escapeHtml(description.slice(0, 160));
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(pageUrl);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${fullTitle}</title>
<meta name="description" content="${safeDesc}" />
<meta property="og:title" content="${fullTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:type" content="article" />
<meta property="og:locale" content="he_IL" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${fullTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
</head>
<body></body>
</html>`;
}

export default async function middleware(req: Request): Promise<Response | undefined> {
  // Only intercept recognised social bots
  const ua = req.headers.get('user-agent') ?? '';
  if (!BOT_PATTERN.test(ua)) return undefined; // pass through to React app

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean); // e.g. ['events', 'abc123']
  const [section, id] = parts;
  if (!id) return undefined;

  let title = SITE_NAME;
  let description = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;

  try {
    if (section === 'events') {
      const f = await airtableFetch('אירועים', `{מזהה קישור}="${id}"`);
      if (f) {
        title = extractText(f['כותרת']) || title;
        description =
          extractText(f['תיאור']) ||
          extractText(f['תקציר קצר']) ||
          description;
        // Use first gallery image if available
        const gallery = f['גלריה'];
        if (!Array.isArray(gallery) || gallery.length === 0) {
          // no gallery — keep default rabbi photo
        }
      }
    } else if (section === 'articles') {
      const f = await airtableFetch('מאמרים', `{מזהה קישור}="${id}"`);
      if (f) {
        title = extractText(f['כותרת']) || title;
        description = extractText(f['תקציר']) || description;
      }
    } else if (section === 'videos') {
      const f = await airtableFetch('שיעורי וידאו', `{מזהה קישור}="${id}"`);
      if (f) {
        title = extractText(f['כותרת']) || title;
        description = extractText(f['תיאור']) || description;
        // Use YouTube thumbnail as OG image
        const ytId = extractText(f['מזהה יוטיוב']).split('&')[0].split('?')[0].trim();
        if (ytId) image = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      }
    }
  } catch {
    // Airtable unreachable — fall back to site defaults above
  }

  return new Response(buildHtml(title, description, image, url.toString()), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
