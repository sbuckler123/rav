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

export async function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (!PAT || !BASE_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Missing config' })); return; }

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const s = await fetchSettings();
    res.statusCode = 200;
    res.end(JSON.stringify({
      notifyEnabled:   s.notifyEnabled,
      notifyEmail:     s.notifyEmail,
      notifyFromEmail: s.notifyFromEmail,
    }));
    return;
  }

  // ── PATCH ────────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const body = JSON.parse(await readBody(req, BODY_LIMITS.SMALL)) as {
      notifyEnabled?:   boolean;
      notifyEmail?:     string;
      notifyFromEmail?: string;
    };

    const { _records } = await fetchSettings();
    const updates: Promise<void>[] = [];

    if (body.notifyEnabled !== undefined && _records['notify_enabled'])
      updates.push(atPatchSetting(_records['notify_enabled'].id, body.notifyEnabled ? 'true' : 'false'));
    if (body.notifyEmail !== undefined && _records['notify_email'])
      updates.push(atPatchSetting(_records['notify_email'].id, body.notifyEmail));
    if (body.notifyFromEmail !== undefined && _records['notify_from_email'])
      updates.push(atPatchSetting(_records['notify_from_email'].id, body.notifyFromEmail));

    await Promise.all(updates);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
