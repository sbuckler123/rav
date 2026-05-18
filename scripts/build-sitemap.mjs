/**
 * Generates dist/sitemap.xml after `vite build`.
 *
 * Static routes are hardcoded below. Dynamic content (articles, videos,
 * shiurim, idkunim) is fetched live from Airtable using AIRTABLE_PAT and
 * AIRTABLE_BASE_ID. Vercel provides those at build time. If they're missing
 * (local dev without secrets) the script still writes a static-only sitemap.
 *
 * Run automatically as a post-build step via `npm run build`.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE_URL = (process.env.PUBLIC_BASE_URL ?? 'https://www.haravkalmanber.co.il').replace(/\/$/, '');
const PAT      = process.env.AIRTABLE_PAT;
const BASE_ID  = process.env.AIRTABLE_BASE_ID;

const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { path: '/',                 priority: '1.0', changefreq: 'daily'   },
  { path: '/odot',             priority: '0.7', changefreq: 'yearly'  },
  { path: '/shiurei-torah',    priority: '0.9', changefreq: 'weekly'  },
  { path: '/luach-iruyim',     priority: '0.9', changefreq: 'weekly'  },
  { path: '/shaal-et-harav',   priority: '0.8', changefreq: 'monthly' },
  { path: '/shut',             priority: '0.9', changefreq: 'weekly'  },
  { path: '/hagut-upsika',     priority: '0.9', changefreq: 'weekly'  },
  { path: '/idkunim',          priority: '0.9', changefreq: 'daily'   },
  { path: '/accessibility',    priority: '0.3', changefreq: 'yearly'  },
  { path: '/privacy',          priority: '0.3', changefreq: 'yearly'  },
  { path: '/terms',            priority: '0.3', changefreq: 'yearly'  },
  { path: '/cookies',          priority: '0.3', changefreq: 'yearly'  },
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function urlNode({ loc, lastmod, priority, changefreq }) {
  const parts = [`    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod)    parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority)   parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

async function fetchTable(table, filter) {
  if (!PAT || !BASE_ID) return [];
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
    if (filter) url.searchParams.set('filterByFormula', filter);
    if (offset) url.searchParams.set('offset', offset);
    url.searchParams.set('pageSize', '100');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${PAT}` } });
    if (!res.ok) throw new Error(`Airtable ${table} HTTP ${res.status}`);
    const data = await res.json();
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);
  return records;
}

function lastmodFor(fields, createdTime) {
  const raw = fields['תאריך'] ?? fields['תאריך עדכון'] ?? createdTime;
  if (!raw || typeof raw !== 'string') return undefined;
  return raw.slice(0, 10); // YYYY-MM-DD
}

async function dynamicEntries() {
  if (!PAT || !BASE_ID) {
    console.warn('[sitemap] AIRTABLE_PAT / AIRTABLE_BASE_ID not set — emitting static routes only');
    return [];
  }

  const tasks = [
    { table: 'מאמרים',         filter: `{סטטוס}="פעיל"`,   prefix: '/hagut-upsika',  priority: '0.7' },
    { table: 'שיעורי וידאו',  filter: `{סטטוס}="פעיל"`,   prefix: '/shiurei-torah', priority: '0.7' },
    { table: 'שיעורים',        filter: undefined,            prefix: '/luach-iruyim',  priority: '0.7' },
    { table: 'על הפרק',        filter: `{סטטוס}="פורסם"`, prefix: '/idkunim',       priority: '0.7' },
  ];

  const out = [];
  for (const t of tasks) {
    try {
      const records = await fetchTable(t.table, t.filter);
      for (const r of records) {
        const linkId = r.fields?.['מזהה קישור'];
        if (typeof linkId !== 'string' || !linkId.trim()) continue;
        out.push({
          loc:        `${SITE_URL}${t.prefix}/${linkId.trim()}`,
          lastmod:    lastmodFor(r.fields, r.createdTime),
          priority:   t.priority,
          changefreq: 'monthly',
        });
      }
      console.log(`[sitemap] ${t.table}: ${records.length} records`);
    } catch (err) {
      console.warn(`[sitemap] ${t.table} failed:`, err?.message ?? err);
    }
  }
  return out;
}

async function main() {
  const distDir = join(process.cwd(), 'dist');
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

  const entries = [
    ...STATIC_ROUTES.map(r => ({
      loc:        `${SITE_URL}${r.path}`,
      lastmod:    TODAY,
      priority:   r.priority,
      changefreq: r.changefreq,
    })),
    ...(await dynamicEntries()),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlNode).join('\n')}
</urlset>
`;

  writeFileSync(join(distDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`[sitemap] wrote ${entries.length} URLs → dist/sitemap.xml`);
}

main().catch(err => {
  console.error('[sitemap] FAILED', err);
  process.exit(1);
});
