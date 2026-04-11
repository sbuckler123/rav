/**
 * Vercel Serverless Function — Admin Questions proxy
 *
 * GET    /api/admin-questions                              → AdminQuestion[] (with answers)
 * GET    /api/admin-questions?type=fieldChoices            → string[] (writer type choices)
 * PATCH  /api/admin-questions?id=xxx                       → update question fields
 * DELETE /api/admin-questions?id=xxx                       → delete question
 * POST   /api/admin-questions                              → create question (admin use)
 * POST   /api/admin-questions?type=reply                   → submit answer
 * PATCH  /api/admin-questions?type=answer&id=xxx           → update answer content
 * DELETE /api/admin-questions?type=answer&id=xxx           → delete answer
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { requireAuth } from './_verifyAuth';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

function readBody(req: IncomingMessage, maxBytes = 50_000): Promise<string> {
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

const auth = () => ({ Authorization: `Bearer ${PAT}` });

async function atFetch(table: string, params: Record<string, string> = {}, sort?: { field: string; direction?: string }[]) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (sort) sort.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
  });
  const res = await fetch(url.toString(), { headers: auth() });
  if (!res.ok) throw new Error(`Airtable ${table}: ${res.status}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown> }[] }>;
}

async function atCreate(table: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable create ${table}: ${res.status}`);
  return res.json() as Promise<{ id: string }>;
}

async function atUpdate(table: string, id: string, fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Airtable update ${table}: ${res.status}`);
  return res.json();
}

async function atDelete(table: string, id: string) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE', headers: auth(),
  });
  if (!res.ok) throw new Error(`Airtable delete ${table}: ${res.status}`);
  return res.json();
}

async function getFieldChoices(tableName: string, fieldName: string): Promise<string[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers: auth() });
  if (!res.ok) return [];
  const data = await res.json() as { tables: { name: string; fields: { name: string; options?: { choices?: { name: string }[] } }[] }[] };
  const table = data.tables?.find((t) => t.name === tableName);
  const field = table?.fields?.find((f) => f.name === fieldName);
  return field?.options?.choices?.map((c) => c.name) ?? [];
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  const url  = new URL(req.url ?? '/', 'https://placeholder');
  const id   = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  try {
    // ── Field choices ────────────────────────────────────────────────────────
    if (type === 'fieldChoices') {
      const choices = await getFieldChoices('תשובות', 'סוג כותב');
      res.statusCode = 200; res.end(JSON.stringify(choices)); return;
    }

    // ── Answer CRUD ──────────────────────────────────────────────────────────
    if (type === 'answer') {
      if (req.method === 'PATCH' && id) {
        const { content } = JSON.parse(await readBody(req)) as { content: string };
        await atUpdate('תשובות', id, { 'תוכן התשובה': content });
        res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
      }
      if (req.method === 'DELETE' && id) {
        await atDelete('תשובות', id);
        res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
      }
    }

    // ── Submit reply (public — no auth required) ─────────────────────────────
    if (type === 'reply' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        questionId: string; content: string; writerType?: string;
      };
      const fields: Record<string, unknown> = {
        'שאלה':          [body.questionId],
        'תוכן התשובה':   body.content,
        'סוג כותב':      body.writerType ?? 'רב',
        'תאריך':         new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jerusalem' }).replace(' ', 'T'),
      };
      const record = await atCreate('תשובות', fields);
      // Also set question status back to ממתין so admin sees the new reply
      await atUpdate('שאלות', body.questionId, { 'סטטוס': 'ממתין' });
      res.statusCode = 200; res.end(JSON.stringify({ success: true, id: record.id })); return;
    }

    // ── Auth required for all remaining operations ────────────────────────────
    if (!(await requireAuth(req, res))) return;

    // ── DELETE question ──────────────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      await atDelete('שאלות', id);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    // ── PATCH question ───────────────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req)) as { fields: Record<string, unknown> };
      await atUpdate('שאלות', id, body.fields);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    // ── POST create question (admin) ─────────────────────────────────────────
    if (req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        content: string; askerName?: string; category?: string;
        status?: string; consentToPublish?: boolean; approvedForPublish?: boolean;
      };
      const fields: Record<string, unknown> = {
        'תוכן השאלה':       body.content,
        'סטטוס':             body.status ?? 'ממתין',
        'הסכמה לפרסום':     body.consentToPublish ?? false,
        'מאושר לפרסום':     body.approvedForPublish ?? false,
        'תאריך':             new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jerusalem' }).replace(' ', 'T'),
      };
      if (body.askerName?.trim()) fields['שם השואל'] = body.askerName.trim();
      if (body.category)          fields['קטגוריה']   = [body.category];
      const record = await atCreate('שאלות', fields);
      res.statusCode = 200; res.end(JSON.stringify({ id: record.id })); return;
    }

    // ── GET all questions with answers ───────────────────────────────────────
    const [questionsData, answersData] = await Promise.all([
      atFetch('שאלות', {}, [{ field: 'תאריך', direction: 'desc' }]),
      atFetch('תשובות', { filterByFormula: 'NOT({שאלה}="")' }).catch(() => ({ records: [] })),
    ]);

    const questions = questionsData.records.map((r) => {
      const f               = r.fields;
      const linkedAnswerIds = (f['תשובות'] as string[]) ?? [];
      const answers = answersData.records
        .filter((a) => linkedAnswerIds.includes(a.id))
        .map((a) => ({
          id:          a.id,
          content:     (a.fields['תוכן התשובה'] as string) ?? '',
          writerType:  (a.fields['סוג כותב'] as string) ?? 'רב',
          date:        a.fields['תאריך'] as string | undefined,
        }))
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

      return {
        id:                 r.id,
        referenceId:        f['מזהה שאלה'] as string | undefined,
        questionContent:    (f['תוכן השאלה'] as string) ?? '',
        askerName:          f['שם השואל'] as string | undefined,
        askerEmail:         f['אימייל השואל'] as string | undefined,
        category:           Array.isArray(f['קטגוריה']) ? (f['קטגוריה'] as string[])[0] : undefined,
        createdAt:          f['תאריך'] as string | undefined,
        status:             (f['סטטוס'] as string) ?? 'ממתין',
        approvedForPublish: f['מאושר לפרסום'] === true,
        consentToPublish:   f['הסכמה לפרסום'] === true,
        answers,
      };
    });

    res.statusCode = 200; res.end(JSON.stringify(questions));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.statusCode = 500; res.end(JSON.stringify({ error: msg }));
  }
}
