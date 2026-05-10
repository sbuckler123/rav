/**
 * Vercel Serverless Function — Questions proxy
 * Fetches/writes from Airtable server-side so AIRTABLE_PAT never reaches the browser.
 *
 * GET  /api/questions                    → published questions with answers
 * GET  /api/questions?categoryId=xxx     → filtered by category
 * POST /api/questions                    → submit a new question
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { captureServerError } from './_sentry';
import { fetchSettings } from './_settings';
import { sendNewQuestionEmail } from './_email';
import { BODY_LIMITS, readBody } from './_readBody';
import { enforceOrigin, enforceRateLimit } from './_security';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME_LEN     = 100;
const MAX_EMAIL_LEN    = 200;
const MAX_QUESTION_LEN = 2_000;

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

function isControlChar(s: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(s);
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
    if (!enforceOrigin(req, res)) return;
    if (!enforceRateLimit(req, res, 'questions:submit', 5, 60_000)) return;

    try {
      const body = JSON.parse(await readBody(req, BODY_LIMITS.SMALL));
      const { name, email, categoryId, question, allowPublic } = body ?? {};

      const nameStr     = typeof name     === 'string' ? name.trim()     : '';
      const emailStr    = typeof email    === 'string' ? email.trim()    : '';
      const questionStr = typeof question === 'string' ? question.trim() : '';

      if (!nameStr || !emailStr || !questionStr) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }
      if (!EMAIL_RE.test(emailStr) || emailStr.length > MAX_EMAIL_LEN) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid email' }));
        return;
      }
      if (isControlChar(nameStr) || isControlChar(emailStr)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid characters' }));
        return;
      }

      const fields: Record<string, unknown> = {
        'תוכן השאלה':   questionStr.slice(0, MAX_QUESTION_LEN),
        'שם השואל':     nameStr.slice(0, MAX_NAME_LEN),
        'אימייל השואל': emailStr,
        'הסכמה לפרסום': !!allowPublic,
        'סטטוס':        'ממתין',
        'תאריך':        new Date().toISOString(),
      };
      if (categoryId && typeof categoryId === 'string') fields['קטגוריה'] = [categoryId];

      const [record, settings] = await Promise.all([
        airtableCreate('שאלות', fields),
        fetchSettings(),
      ]);

      if (settings.notifyEnabled && settings.notifyEmail && settings.notifyFromEmail) {
        await sendNewQuestionEmail({
          toEmail:         settings.notifyEmail,
          fromEmail:       settings.notifyFromEmail,
          askerName:       String(name),
          questionContent: String(question),
          referenceId:     String(record.fields?.['מזהה שאלה'] ?? ''),
        }).catch((err) => {
          captureServerError(err, {
            handler:     'questions-email',
            referenceId: String(record.fields?.['מזהה שאלה'] ?? ''),
          });
        });
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        id: record.id,
        referenceId: record.fields?.['מזהה שאלה'] ?? '',
      }));
    } catch (err) {
      captureServerError(err, { handler: 'questions', method: 'POST' });
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
            title: (a.fields['כותרת התשובה'] as string) ?? '',
            content: a.fields['תוכן התשובה'] ?? '',
            writerType: a.fields['סוג כותב'] ?? 'רב',
            date: a.fields['תאריך'],
          }));

        return {
          id: r.id,
          referenceId: r.fields['מזהה שאלה'],
          questionContent: r.fields['תוכן השאלה'] ?? '',
          category: Array.isArray(r.fields['קטגוריה']) ? r.fields['קטגוריה'][0] : undefined,
          createdAt: r.fields['תאריך'],
          followUpBlocked: r.fields['חסום שאלות המשך'] === true,
          answers,
        };
      });

    res.statusCode = 200;
    res.end(JSON.stringify({ questions }));
  } catch (err) {
    captureServerError(err, { handler: 'questions', method: req.method ?? '', url: req.url ?? '' });
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch questions' }));
  }
}
