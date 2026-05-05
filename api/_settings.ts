/** Shared notification settings reader — used by questions.ts and _admin-settings.ts */

const PAT     = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

export interface NotificationSettings {
  notifyEnabled:   boolean;
  notifyEmail:     string;
  notifyFromEmail: string;
}

export interface SettingsFull extends NotificationSettings {
  _records: Record<string, { id: string; value: string }>;
}

const DEFAULTS: SettingsFull = {
  notifyEnabled:   false,
  notifyEmail:     '',
  notifyFromEmail: '',
  _records:        {},
};

export async function fetchSettings(): Promise<SettingsFull> {
  if (!PAT || !BASE_ID) return DEFAULTS;

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('הגדרות')}`,
    );
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${PAT}` },
    });
    if (!res.ok) return DEFAULTS;

    const data = await res.json() as {
      records: { id: string; fields: Record<string, unknown> }[];
    };

    const _records: Record<string, { id: string; value: string }> = {};
    for (const r of data.records) {
      const key = r.fields['מפתח'] as string | undefined;
      if (key) _records[key] = { id: r.id, value: (r.fields['ערך'] as string) ?? '' };
    }

    return {
      notifyEnabled:   _records['notify_enabled']?.value === 'true',
      notifyEmail:     _records['notify_email']?.value ?? '',
      notifyFromEmail: _records['notify_from_email']?.value ?? '',
      _records,
    };
  } catch {
    return DEFAULTS;
  }
}
