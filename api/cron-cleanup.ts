/**
 * Vercel Cron — Data retention cleanup
 *
 * Runs daily (configured in vercel.json). For questions older than 24 months
 * that are in a terminal state ('נענה' or 'נדחה'):
 *   - If the asker consented to publication ('הסכמה לפרסום' = TRUE) → clear
 *     שם השואל + אימייל השואל so the public Q&A stays useful but PII is gone.
 *   - Otherwise → hard-delete the record.
 *
 * Pending questions ('ממתין') are never touched — retention starts from the
 * end of treatment, and we use the submission date as a conservative proxy
 * for that (since most questions get answered within days, not months).
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Vercel injects this
 * header automatically on cron invocations when CRON_SECRET is configured.
 * Fails closed if the env var is unset.
 *
 * Cap: MAX_PER_RUN records per invocation, to stay well under the serverless
 * timeout. A backlog clears over consecutive nightly runs.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { captureServerError } from './_sentry';

const PAT         = process.env.AIRTABLE_PAT;
const BASE_ID     = process.env.AIRTABLE_BASE_ID;
const CRON_SECRET = process.env.CRON_SECRET;

const TABLE             = 'שאלות';
const RETENTION_DAYS    = 730;   // ~24 months
const MAX_PER_RUN       = 200;
const PAGE_SIZE         = 100;
const STATUS_FILTER     = `OR({סטטוס}='נענה',{סטטוס}='נדחה')`;

const auth = () => ({ Authorization: `Bearer ${PAT}` });

async function fetchPage(offset?: string) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
  url.searchParams.set('filterByFormula', STATUS_FILTER);
  url.searchParams.set('pageSize', String(PAGE_SIZE));
  if (offset) url.searchParams.set('offset', offset);
  const res = await fetch(url.toString(), { headers: auth() });
  if (!res.ok) throw new Error(`Airtable fetch ${res.status}`);
  return res.json() as Promise<{
    records: { id: string; fields: Record<string, unknown> }[];
    offset?: string;
  }>;
}

async function patchRecord(id: string, fields: Record<string, unknown>) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${id}`,
    {
      method: 'PATCH',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, typecast: true }),
    },
  );
  if (!res.ok) throw new Error(`Airtable patch ${res.status}`);
}

async function deleteRecord(id: string) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${id}`,
    { method: 'DELETE', headers: auth() },
  );
  if (!res.ok) throw new Error(`Airtable delete ${res.status}`);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  // Auth: must match CRON_SECRET. Fail closed if env var unset.
  const authHeader = req.headers.authorization ?? '';
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing config' }));
    return;
  }

  const cutoffMs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const summary = { processed: 0, anonymized: 0, deleted: 0, skipped: 0, errors: 0, cutoffISO: new Date(cutoffMs).toISOString() };

  try {
    let offset: string | undefined;
    let capHit = false;
    do {
      const page = await fetchPage(offset);

      for (const rec of page.records) {
        if (summary.processed >= MAX_PER_RUN) { capHit = true; break; }

        const dateStr = rec.fields['תאריך'] as string | undefined;
        const submittedMs = dateStr ? new Date(dateStr).getTime() : NaN;
        // Skip rows with no parseable date or still inside the retention window
        if (!Number.isFinite(submittedMs) || submittedMs > cutoffMs) {
          summary.skipped++;
          continue;
        }

        // Skip rows that have already been anonymized (no PII left)
        const hasName  = typeof rec.fields['שם השואל']     === 'string' && (rec.fields['שם השואל']     as string).length > 0;
        const hasEmail = typeof rec.fields['אימייל השואל'] === 'string' && (rec.fields['אימייל השואל'] as string).length > 0;
        if (rec.fields['הסכמה לפרסום'] === true && !hasName && !hasEmail) {
          summary.skipped++;
          continue;
        }

        try {
          if (rec.fields['הסכמה לפרסום'] === true) {
            await patchRecord(rec.id, { 'שם השואל': '', 'אימייל השואל': '' });
            summary.anonymized++;
          } else {
            await deleteRecord(rec.id);
            summary.deleted++;
          }
          summary.processed++;
        } catch (err) {
          summary.errors++;
          captureServerError(err, { handler: 'cron-cleanup', recordId: rec.id });
        }
      }

      offset = capHit ? undefined : page.offset;
    } while (offset);

    res.statusCode = 200;
    res.end(JSON.stringify(summary));
  } catch (err) {
    captureServerError(err, { handler: 'cron-cleanup', stage: 'top' });
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal error', ...summary }));
  }
}
