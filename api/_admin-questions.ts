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
import type { AdminRequest } from './admin';
import { BODY_LIMITS, readBody } from './_readBody';
import { enforceOrigin, enforceRateLimit } from './_security';
import { captureServerError } from './_sentry';
import { fetchSettings } from './_settings';
import { sendFollowUpEmail } from './_email';

const RECORD_ID_RE = /^rec[a-zA-Z0-9]{14}$/;

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const PUBLIC_REPLY_MAX_LEN = 5_000;

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

export async function handle(req: IncomingMessage, res: ServerResponse) {
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
        const body = JSON.parse(await readBody(req, BODY_LIMITS.MEDIUM)) as {
          content?: string; title?: string; pendingApproval?: boolean;
        };
        const fields: Record<string, unknown> = {};
        if (body.content !== undefined)         fields['תוכן התשובה']  = body.content;
        if (body.title !== undefined)           fields['כותרת התשובה'] = body.title;
        if (body.pendingApproval !== undefined) fields['ממתין לאישור'] = body.pendingApproval;
        if (Object.keys(fields).length === 0) {
          res.statusCode = 400; res.end(JSON.stringify({ error: 'No fields to update' })); return;
        }
        await atUpdate('תשובות', id, fields);
        res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
      }
      if (req.method === 'DELETE' && id) {
        await atDelete('תשובות', id);
        res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
      }
    }

    // ── Submit reply ─────────────────────────────────────────────────────────
    // Authenticated admins write a new answer record to Airtable directly
    // (used by QuestionsPage and QuestionDetailPage in the admin UI). These
    // are not gated — they auto-publish.
    //
    // Unauthenticated callers (asker follow-ups from the public Q&A page) save
    // to Airtable with `ממתין לאישור = true` so the answer is invisible on the
    // public Q&A feed until an admin approves it. This closes the impersonation
    // vector — anyone can still submit content, but nothing renders publicly
    // under the asker's identity without explicit admin review. A notification
    // email is also sent to the rabbi.
    if (type === 'reply' && req.method === 'POST') {
      const isAdmin = !!(req as AdminRequest).adminCtx;

      if (isAdmin) {
        const body = JSON.parse(await readBody(req, BODY_LIMITS.MEDIUM)) as {
          questionId: string; content: string; writerType?: string; title?: string;
        };
        if (!body.questionId || typeof body.content !== 'string' || !body.content.trim()) {
          res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing fields' })); return;
        }

        const fields: Record<string, unknown> = {
          'שאלה':          [body.questionId],
          'תוכן התשובה':   body.content,
          'סוג כותב':      body.writerType ?? 'רב',
          'תאריך':         new Date().toISOString(),
        };
        if (body.title?.trim()) fields['כותרת התשובה'] = body.title.trim();

        const record = await atCreate('תשובות', fields);
        // Reset status to ממתין so admin notices the new reply
        await atUpdate('שאלות', body.questionId, { 'סטטוס': 'ממתין' });
        res.statusCode = 200; res.end(JSON.stringify({ success: true, id: record.id })); return;
      }

      // Unauthenticated follow-up: write to Airtable with ממתין לאישור=true
      // (hidden from public until admin approves) and notify the rabbi by email.
      if (!enforceOrigin(req, res)) return;
      if (!enforceRateLimit(req, res, 'questions:reply', 5, 60_000)) return;

      const body = JSON.parse(await readBody(req, BODY_LIMITS.MEDIUM)) as {
        questionId: string; content: string;
      };
      if (!body.questionId || typeof body.content !== 'string' || !body.content.trim()) {
        res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing fields' })); return;
      }
      if (!RECORD_ID_RE.test(body.questionId)) {
        res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid question id' })); return;
      }

      const content = body.content.slice(0, PUBLIC_REPLY_MAX_LEN);

      // Fetch the question to enrich the email and verify it's publicly visible.
      const qRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('שאלות')}/${body.questionId}`,
        { headers: auth() },
      );
      if (!qRes.ok) {
        res.statusCode = 404; res.end(JSON.stringify({ error: 'Question not found' })); return;
      }
      const question = await qRes.json() as { id: string; fields: Record<string, unknown> };
      const f = question.fields;

      // Only accept follow-ups against questions that are publicly visible —
      // otherwise we'd leak the existence of unpublished/rejected questions.
      const consent  = f['הסכמה לפרסום']  === true;
      const approved = f['מאושר לפרסום'] === true;
      const rejected = f['סטטוס'] === 'נדחה';
      if (!consent || !approved || rejected) {
        res.statusCode = 404; res.end(JSON.stringify({ error: 'Question not found' })); return;
      }
      // Honor the admin's per-question "block follow-ups" flag server-side.
      if (f['חסום שאלות המשך'] === true) {
        res.statusCode = 403; res.end(JSON.stringify({ error: 'Follow-ups are disabled for this question' })); return;
      }

      // Persist the follow-up as a pending answer record (hidden from public).
      await atCreate('תשובות', {
        'שאלה':          [body.questionId],
        'תוכן התשובה':   content,
        'סוג כותב':      'השואל',
        'תאריך':         new Date().toISOString(),
        'ממתין לאישור': true,
      });
      // Flip question status back to 'ממתין' so the admin sees it needs attention.
      await atUpdate('שאלות', body.questionId, { 'סטטוס': 'ממתין' });

      // Notify the rabbi by email (fail-soft — the record is already saved).
      const settings = await fetchSettings();
      if (settings.notifyEnabled && settings.notifyEmail && settings.notifyFromEmail) {
        await sendFollowUpEmail({
          toEmail:         settings.notifyEmail,
          fromEmail:       settings.notifyFromEmail,
          askerName:       String(f['שם השואל'] ?? ''),
          askerEmail:      String(f['אימייל השואל'] ?? ''),
          questionContent: String(f['תוכן השאלה'] ?? ''),
          followUpContent: content,
          referenceId:     String(f['מזהה שאלה'] ?? ''),
        }).catch((err) => {
          captureServerError(err, { handler: 'admin-questions', method: 'follow-up-email' });
        });
      }

      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    // ── DELETE question ──────────────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      await atDelete('שאלות', id);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    // ── PATCH question ───────────────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req, BODY_LIMITS.MEDIUM)) as { fields: Record<string, unknown> };
      await atUpdate('שאלות', id, body.fields);
      res.statusCode = 200; res.end(JSON.stringify({ success: true })); return;
    }

    // ── POST create question (admin) ─────────────────────────────────────────
    if (req.method === 'POST') {
      const body = JSON.parse(await readBody(req, BODY_LIMITS.MEDIUM)) as {
        content: string; askerName?: string; category?: string;
        status?: string; consentToPublish?: boolean; approvedForPublish?: boolean;
      };
      const fields: Record<string, unknown> = {
        'תוכן השאלה':       body.content,
        'סטטוס':             body.status ?? 'ממתין',
        'הסכמה לפרסום':     body.consentToPublish ?? false,
        'מאושר לפרסום':     body.approvedForPublish ?? false,
        'תאריך':             new Date().toISOString(),
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
          id:               a.id,
          title:            (a.fields['כותרת התשובה'] as string) ?? '',
          content:          (a.fields['תוכן התשובה'] as string) ?? '',
          writerType:       (a.fields['סוג כותב'] as string) ?? 'רב',
          date:             a.fields['תאריך'] as string | undefined,
          pendingApproval:  a.fields['ממתין לאישור'] === true,
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
        followUpBlocked:    f['חסום שאלות המשך'] === true,
        answers,
      };
    });

    res.statusCode = 200; res.end(JSON.stringify(questions));
  } catch (err) {
    captureServerError(err, { handler: 'admin-questions', method: req.method ?? '' });
    res.statusCode = 500; res.end(JSON.stringify({ error: 'Internal error' }));
  }
}
