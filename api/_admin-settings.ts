import type { IncomingMessage, ServerResponse } from 'http';
import { fetchSettings } from './_settings';
import { BODY_LIMITS, readBody } from './_readBody';

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

async function atPatchSetting(id: string, value: string): Promise<void> {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('הגדרות')}/${id}`,
    {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fields: { 'ערך': value } }),
    },
  );
  if (!res.ok) throw new Error(`Airtable settings PATCH: ${res.status}`);
}

async function atCreateSetting(key: string, value: string): Promise<void> {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('הגדרות')}`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fields: { 'מפתח': key, 'ערך': value } }),
    },
  );
  if (!res.ok) throw new Error(`Airtable settings CREATE: ${res.status}`);
}

async function upsertSetting(
  key: string,
  value: string,
  records: Record<string, { id: string; value: string }>,
): Promise<void> {
  if (records[key]) return atPatchSetting(records[key].id, value);
  return atCreateSetting(key, value);
}

export async function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const s = await fetchSettings();
    res.statusCode = 200;
    res.end(JSON.stringify({
      notifyEnabled:      s.notifyEnabled,
      notifyEmail:        s.notifyEmail,
      notifyFromEmail:    s.notifyFromEmail,
      notifyAskerOnReply: s.notifyAskerOnReply,
      publicBaseUrl:      s.publicBaseUrl,
    }));
    return;
  }

  // ── PATCH ────────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const body = JSON.parse(await readBody(req, BODY_LIMITS.SMALL)) as {
      notifyEnabled?:      boolean;
      notifyEmail?:        string;
      notifyFromEmail?:    string;
      notifyAskerOnReply?: boolean;
      publicBaseUrl?:      string;
    };

    const { _records } = await fetchSettings();
    const updates: Promise<void>[] = [];

    if (body.notifyEnabled !== undefined)
      updates.push(upsertSetting('notify_enabled', body.notifyEnabled ? 'true' : 'false', _records));
    if (body.notifyEmail !== undefined)
      updates.push(upsertSetting('notify_email', body.notifyEmail, _records));
    if (body.notifyFromEmail !== undefined)
      updates.push(upsertSetting('notify_from_email', body.notifyFromEmail, _records));
    if (body.notifyAskerOnReply !== undefined)
      updates.push(upsertSetting('notify_asker_on_reply', body.notifyAskerOnReply ? 'true' : 'false', _records));
    if (body.publicBaseUrl !== undefined)
      updates.push(upsertSetting('public_base_url', body.publicBaseUrl, _records));

    await Promise.all(updates);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
