import { airtableFetch } from './airtable';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'מנהל' | 'רב' | 'צוות';
}

export async function loginWithEmail(email: string, password: string): Promise<AdminUser> {
  const data = await airtableFetch('משתמשים', {
    filterByFormula: `AND({אימייל}='${email}',{סיסמא}='${password}',{סטטוס}='פעיל')`,
  });

  if (!data.records || data.records.length === 0) {
    throw new Error('אימייל או סיסמה שגויים');
  }

  const record = data.records[0];
  const f = record.fields;

  return {
    id: record.id,
    name: f['שם'] ?? '',
    email: f['אימייל'] ?? '',
    role: f['תפקיד'] ?? 'צוות',
  };
}
