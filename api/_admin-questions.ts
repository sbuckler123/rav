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
import { requireTurnstile } from './_turnstile';
import { captureServerError } from './_sentry';
import { fetchSettings } from './_settings';
import { sendFollowUpEmail, sendAnswerToAskerEmail } from './_email';

const RECORD_ID_RE = /^rec[a-zA-Z0-9]{14}$/;
const REFERENCE_ID_RE = /^\d{1,10}$/;

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const PUBLIC_REPLY_MAX_LEN = 5_000;

/**
 * Resolves a public `referenceId` (the numeric "מזהה שאלה" autonumber) to the
 * internal Airtable record ID. Returns null if no matching question exists.
 * Used by the public follow-up flow so rec IDs never leave the server.
 */
async function recordIdForReference(referenceId: string): Promise<string | null> {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('שאלות')}`);
  url.searchParams.set('filterByFormula', `{מזהה שאלה}=${referenceId}`);
  url.searchParams.set('maxRecords', '1');
  const res = await fetch(url.toString(), { headers: auth() });
  if (!res.ok) return null;
  const data = await res.json() as { records: { id: string }[] };
  return data.records[0]?.id ?? null;
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

/**
 * Sends an email to the asker with the rabbi's answer. Includes a "view on
 * site" link only when the question is publicly visible (consent + approved).
 * BCCs the rabbi so they get a copy of what was sent. Fail-soft — caller
 * should swallow the rejection.
 */
async function notifyAskerOfAnswer(
  questionId: string,
  answerContent: string,
  answerTitle: string | undefined,
  writerType: string,
): Promise<void> {
  const settings = await fetchSettings();
  if (!settings.notifyAskerOnReply) return;
  if (!settings.notifyEnabled || !settings.notifyEmail || !settings.notifyFromEmail) return;

  const qRes = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('שאלות')}/${questionId}`,
    { headers: auth() },
  );
  if (!qRes.ok) return;
  const question = await qRes.json() as { id: string; fields: Record<string, unknown> };
  const f = question.fields;

  const askerEmail = typeof f['אימייל השואל'] === 'string' ? f['אימייל השואל'] : '';
  if (!askerEmail) return; // older / admin-created questions may not have an email

  const baseUrl = settings.publicBaseUrl.replace(/\/$/, '');
  const isPubliclyVisible =
    f['הסכמה לפרסום']  === true &&
    f['מאושר לפרסום'] === true;
  // Use the public-facing referenceId (numeric "מזהה שאלה") for deep links so
  // the URL doesn't leak Airtable rec IDs. The DOM anchor on the public Q&A
  // page is keyed on the same value.
  const referenceId = f['מזהה שאלה'] != null ? String(f['מזהה שאלה']) : '';
  const publicUrl   = isPubliclyVisible && referenceId ? `${baseUrl}/shut#q-${referenceId}` : undefined;
  // Always provide a follow-up URL. For published questions it points to the
  // public Q&A page (which has the follow-up form). Otherwise it points to
  // the new-question form on the askPage.
  const followUpUrl = isPubliclyVisible && referenceId ? `${baseUrl}/shut#q-${referenceId}` : `${baseUrl}/shaal-et-harav`;

  // Reply-To is intentionally NOT set. The From address is no-reply, so
  // replies will bounce; the footer directs the asker to follow up via the
  // website instead. The rabbi gets the BCC copy in his inbox (BCC is hidden
  // by the protocol, so the rabbi's address is not exposed to the asker).
  await sendAnswerToAskerEmail({
    toEmail:         askerEmail,
    fromEmail:       settings.notifyFromEmail,
    bccEmail:        settings.notifyEmail,
    askerName:       String(f['שם השואל'] ?? ''),
    questionContent: String(f['תוכן השאלה'] ?? ''),
    answerTitle,
    answerContent,
    referenceId,
    writerType,
    publicUrl,
    followUpUrl,
    isPubliclyVisible,
  });
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
          questionId?: string; referenceId?: string; content: string; writerType?: string; title?: string;
        };
        if (typeof body.content !== 'string' || !body.content.trim() || (!body.questionId && !body.referenceId)) {
          res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing fields' })); return;
        }

        // Admin clients pass questionId (rec ID) directly. The public Q&A page
        // sends referenceId only — happens when an admin is signed in and uses
        // the public follow-up form — so resolve it server-side.
        let questionRecordId = body.questionId;
        if (!questionRecordId && body.referenceId) {
          if (!REFERENCE_ID_RE.test(body.referenceId)) {
            res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid question id' })); return;
          }
          const resolved = await recordIdForReference(body.referenceId);
          if (!resolved) {
            res.statusCode = 404; res.end(JSON.stringify({ error: 'Question not found' })); return;
          }
          questionRecordId = resolved;
        }

        const writerType = body.writerType ?? 'רב';
        const answerTitle = body.title?.trim();

        const fields: Record<string, unknown> = {
          'שאלה':          [questionRecordId],
          'תוכן התשובה':   body.content,
          'סוג כותב':      writerType,
          'תאריך':         new Date().toISOString(),
        };
        if (answerTitle) fields['כותרת התשובה'] = answerTitle;

        const record = await atCreate('תשובות', fields);
        // Reset status to ממתין so admin notices the new reply
        await atUpdate('שאלות', questionRecordId!, { 'סטטוס': 'ממתין' });

        // Notify the asker when the rabbi or the secretariat replied (but not
        // when the asker themself sent a follow-up). Fail-soft: the admin's
        // write succeeds even if the email send fails.
        if ((writerType === 'רב' || writerType === 'מזכירות') && RECORD_ID_RE.test(questionRecordId!)) {
          notifyAskerOfAnswer(questionRecordId!, body.content, answerTitle, writerType).catch((err) => {
            captureServerError(err, { handler: 'admin-questions', method: 'notify-asker' });
          });
        }

        res.statusCode = 200; res.end(JSON.stringify({ success: true, id: record.id })); return;
      }

      // Unauthenticated follow-up: write to Airtable with ממתין לאישור=true
      // (hidden from public until admin approves) and notify the rabbi by email.
      if (!enforceOrigin(req, res)) return;
      if (!enforceRateLimit(req, res, 'questions:reply', 5, 60_000)) return;

      const body = JSON.parse(await readBody(req, BODY_LIMITS.MEDIUM)) as {
        referenceId?: string; content: string; turnstileToken?: string;
      };

      // Bot protection (no-op until TURNSTILE_SECRET_KEY is configured)
      if (!(await requireTurnstile(req, res, body.turnstileToken))) return;
      if (!body.referenceId || typeof body.content !== 'string' || !body.content.trim()) {
        res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing fields' })); return;
      }
      if (!REFERENCE_ID_RE.test(body.referenceId)) {
        res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid question id' })); return;
      }

      // Resolve the public referenceId to the internal rec ID. Returning the
      // same 404 as a missing question avoids leaking whether the ID exists.
      const questionRecordId = await recordIdForReference(body.referenceId);
      if (!questionRecordId) {
        res.statusCode = 404; res.end(JSON.stringify({ error: 'Question not found' })); return;
      }

      const content = body.content.slice(0, PUBLIC_REPLY_MAX_LEN);

      // Fetch the question to enrich the email and verify it's publicly visible.
      const qRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('שאלות')}/${questionRecordId}`,
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
        'שאלה':          [questionRecordId],
        'תוכן התשובה':   content,
        'סוג כותב':      'השואל',
        'תאריך':         new Date().toISOString(),
        'ממתין לאישור': true,
      });
      // Flip question status back to 'ממתין' so the admin sees it needs attention.
      await atUpdate('שאלות', questionRecordId, { 'סטטוס': 'ממתין' });

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
        referenceId:        f['מזהה שאלה'] != null ? String(f['מזהה שאלה']) : undefined,
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
