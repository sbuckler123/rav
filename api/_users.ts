/**
 * Vercel Serverless Function — Users proxy
 * Manages admin users in both Clerk (auth) and Airtable (metadata).
 *
 * GET    /api/users              → AdminUser[]
 * POST   /api/users              → create user in Clerk + Airtable
 * PATCH  /api/users?id=xxx       → update name/role/status in Airtable + optionally password in Clerk
 * DELETE /api/users?id=xxx       → delete from Clerk + Airtable
 */

import type { IncomingMessage, ServerResponse } from 'http';

const PAT          = process.env.AIRTABLE_PAT;
const BASE_ID      = process.env.AIRTABLE_BASE_ID;
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const TABLE        = 'משתמשים';
const CLERK_API    = 'https://api.clerk.com/v1';

// ─── helpers ─────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function airtableGet(filter?: string) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
  if (filter) url.searchParams.set('filterByFormula', filter);
  url.searchParams.set('sort[0][field]', 'שם');
  url.searchParams.set('sort[0][direction]', 'asc');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!res.ok) throw new Error(`Airtable GET error: ${res.status}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown> }[] }>;
}

async function airtableGetById(id: string) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${id}`,
    { headers: { Authorization: `Bearer ${PAT}` } },
  );
  if (!res.ok) throw new Error(`Airtable GET error: ${res.status}`);
  return res.json() as Promise<{ id: string; fields: Record<string, unknown> }>;
}

async function airtableCreate(fields: Record<string, unknown>) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    },
  );
  if (!res.ok) throw new Error(`Airtable CREATE error: ${res.status}`);
  return res.json() as Promise<{ id: string; fields: Record<string, unknown> }>;
}

async function airtableUpdate(id: string, fields: Record<string, unknown>) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${id}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    },
  );
  if (!res.ok) throw new Error(`Airtable UPDATE error: ${res.status}`);
  return res.json();
}

async function airtableDelete(id: string) {
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${id}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${PAT}` } },
  );
  if (!res.ok) throw new Error(`Airtable DELETE error: ${res.status}`);
  return res.json();
}

async function clerkCreateUser(email: string, password: string, name: string) {
  const spaceIdx = name.indexOf(' ');
  const firstName = spaceIdx > -1 ? name.slice(0, spaceIdx) : name;
  const lastName  = spaceIdx > -1 ? name.slice(spaceIdx + 1) : '';

  const res = await fetch(`${CLERK_API}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [email],
      password,
      first_name: firstName,
      last_name: lastName,
      skip_password_checks: false,
      skip_password_requirement: false,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any)?.errors?.[0]?.message ?? `Clerk error: ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<{ id: string }>;
}

async function clerkUpdatePassword(clerkUserId: string, password: string) {
  const res = await fetch(`${CLERK_API}/users/${clerkUserId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, skip_password_checks: false }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any)?.errors?.[0]?.message ?? `Clerk error: ${res.status}`;
    throw new Error(msg);
  }
}

async function clerkDeleteUser(clerkUserId: string) {
  const res = await fetch(`${CLERK_API}/users/${clerkUserId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${CLERK_SECRET}` },
  });
  // 404 is fine — user may not have been created in Clerk
  if (!res.ok && res.status !== 404) {
    throw new Error(`Clerk DELETE error: ${res.status}`);
  }
}

// ─── handler ─────────────────────────────────────────────────────────────────

export async function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (!PAT || !BASE_ID) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing Airtable configuration' }));
    return;
  }
  if (!CLERK_SECRET) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing Clerk configuration' }));
    return;
  }

  const reqUrl = new URL(req.url ?? '/', 'https://placeholder');
  const id = reqUrl.searchParams.get('id');

  try {
    // ── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      // Fetch Airtable record to get clerk_id
      const record = await airtableGetById(id);
      const clerkId = record.fields['clerk_id'] as string | undefined;

      // Delete from Clerk first (if we have a clerkId)
      if (clerkId) {
        await clerkDeleteUser(clerkId);
      }

      // Delete from Airtable
      await airtableDelete(id);

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // ── PATCH ────────────────────────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const body = JSON.parse(await readBody(req)) as {
        name?: string;
        role?: string;
        status?: string;
        password?: string;
      };

      // If password supplied, update in Clerk
      if (body.password?.trim()) {
        const record = await airtableGetById(id);
        const clerkId = record.fields['clerk_id'] as string | undefined;
        if (clerkId) {
          await clerkUpdatePassword(clerkId, body.password.trim());
        }
      }

      // Update Airtable metadata
      const fields: Record<string, unknown> = {};
      if (body.name)   fields['שם']     = body.name.trim();
      if (body.role)   fields['תפקיד'] = body.role;
      if (body.status) fields['סטטוס'] = body.status;
      if (Object.keys(fields).length) {
        await airtableUpdate(id, fields);
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        name: string;
        email: string;
        password: string;
        role: string;
        status: string;
      };

      if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'שם, אימייל וסיסמה הם שדות חובה' }));
        return;
      }

      // 1. Create user in Clerk
      const clerkUser = await clerkCreateUser(
        body.email.trim(),
        body.password.trim(),
        body.name.trim(),
      );

      // 2. Create record in Airtable (without password — stored in Clerk only)
      const record = await airtableCreate({
        'שם':      body.name.trim(),
        'אימייל':  body.email.trim(),
        'תפקיד':  body.role ?? 'צוות',
        'סטטוס':  body.status ?? 'פעיל',
        'clerk_id': clerkUser.id,
      });

      res.statusCode = 200;
      res.end(JSON.stringify({
        id: record.id,
        name: body.name.trim(),
        email: body.email.trim(),
        role: body.role ?? 'צוות',
        status: body.status ?? 'פעיל',
      }));
      return;
    }

    // ── GET ──────────────────────────────────────────────────────────────────
    const data = await airtableGet();
    const users = data.records.map((r) => ({
      id:     r.id,
      name:   (r.fields['שם']     as string) ?? '',
      email:  (r.fields['אימייל'] as string) ?? '',
      role:   (r.fields['תפקיד'] as string) ?? 'צוות',
      status: (r.fields['סטטוס'] as string) ?? 'פעיל',
    }));
    res.statusCode = 200;
    res.end(JSON.stringify(users));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.statusCode = 500;
    res.end(JSON.stringify({ error: message }));
  }
}
