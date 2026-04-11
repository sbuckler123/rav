/**
 * Vercel Serverless Function — Questions proxy
 * Fetches/writes from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET  /api/questions                    → published questions with answers
 * GET  /api/questions?categoryId=xxx     → filtered by category
 * POST /api/questions                    → submit a new question
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// ─── helpers ─────────────────────────────────────────────────────────────────

async function airtableFetch(
  table: string,
  params: Record<string, string> = {},
) {
  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`,
  );
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown> }[] }>;
}

async function airtableCreate(table: string, fields: Record<string, unknown>) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields, typecast: true }),
    },
  );
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  return res.json() as Promise<{ id: string; fields: Record<string, unknown> }>;
}

function readBody(req: IncomingMessage, maxBytes = 10_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) { req.destroy(); reject(new Error('Request too large')); return; }
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing server configuration' }));
    return;
  }

  // ── POST: submit a new question ──────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const { name, email, categoryId, question, allowPublic } = body;

      if (!name || !email || !question) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }

      const fields: Record<string, unknown> = {
        'תוכן השאלה': String(question).slice(0, 2000),
        'שם השואל':   String(name).slice(0, 100),
        'אימייל השואל': String(email).slice(0, 200),
        'הסכמה לפרסום': !!allowPublic,
        'סטטוס': 'ממתין',
        'תאריך': new Date().toISOString().split('T')[0],
      };
      if (categoryId) fields['קטגוריה'] = [categoryId];

      const record = await airtableCreate('שאלות', fields);
      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        id: record.id,
        referenceId: record.fields?.['מזהה שאלה'] ?? '',
      }));
    } catch {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to submit question' }));
    }
    return;
  }

  // ── GET: fetch published questions ──────────────────────────────────────
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  try {
    const reqUrl = new URL(req.url ?? '/', `https://placeholder`);
    const categoryId = reqUrl.searchParams.get('categoryId');

    const [questionsData, answersData] = await Promise.all([
      airtableFetch('שאלות', {
        filterByFormula: "AND({הסכמה לפרסום}=TRUE(),{מאושר לפרסום}=TRUE(),NOT({סטטוס}='נדחה'))",
      }),
      airtableFetch('תשובות', { filterByFormula: 'NOT({שאלה}="")' }).catch(() => ({ records: [] })),
    ]);

    const questions = questionsData.records
      .filter((r) => {
        if (!categoryId) return true;
        const linked = r.fields['קטגוריה'];
        return Array.isArray(linked) && linked.includes(categoryId);
      })
      .map((r) => {
        const linkedAnswerIds = Array.isArray(r.fields['תשובות'])
          ? (r.fields['תשובות'] as string[])
          : [];
        const answers = answersData.records
          .filter((a) => linkedAnswerIds.includes(a.id))
          .map((a) => ({
            id: a.id,
            content: a.fields['תוכן התשובה'] ?? '',
            writerType: a.fields['סוג כותב'] ?? 'רב',
            date: a.fields['תאריך'],
          }));

        return {
          id: r.id,
          referenceId: r.fields['מזהה שאלה'],
          questionContent: r.fields['תוכן השאלה'] ?? '',
          askerName: r.fields['שם השואל'],
          category: Array.isArray(r.fields['קטגוריה']) ? r.fields['קטגוריה'][0] : undefined,
          createdAt: r.fields['תאריך'],
          answers,
        };
      });

    res.statusCode = 200;
    res.end(JSON.stringify({ questions }));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch questions' }));
  }
}
