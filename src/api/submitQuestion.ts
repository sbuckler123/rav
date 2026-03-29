import { airtableCreate } from './airtable';

export async function submitQuestion(input: {
  name: string;
  email: string;
  categoryId?: string;
  topic?: string;
  question: string;
  allowPublic: boolean;
}): Promise<{ success: boolean; id?: string; referenceId?: string }> {
  const fields: Record<string, unknown> = {
    'תוכן השאלה': input.question,
    'שם השואל': input.name,
    'אימייל השואל': input.email,
    'הסכמה לפרסום': input.allowPublic,
    'סטטוס': 'ממתין',
    'תאריך': new Date().toISOString().split('T')[0],
  };

  if (input.categoryId) {
    fields['קטגוריה'] = [input.categoryId];
  }

  const record = await airtableCreate('שאלות', fields);
  return { success: true, id: record.id, referenceId: record.fields?.['מזהה שאלה'] ?? '' };
}
