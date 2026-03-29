import { airtableCreate } from './airtable';

export async function submitReply(input: {
  questionId: string;
  content: string;
  writerType?: string;
}): Promise<{ success: boolean; id?: string }> {
  const fields: Record<string, unknown> = {
    'שאלה': [input.questionId],
    'תוכן התשובה': input.content,
    'סוג כותב': input.writerType ?? 'רב',
    'תאריך': new Date().toISOString().split('T')[0],
  };

  const record = await airtableCreate('תשובות', fields);
  return { success: true, id: record.id };
}
