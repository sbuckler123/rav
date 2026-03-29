import { airtableFetch, airtableCreate, airtableUpdate, airtableDelete } from './airtable';
import { submitReply } from './submitReply';

export interface AdminAnswer {
  id: string;
  content: string;
  writerType: string;
  date?: string;
}

export interface AdminQuestion {
  id: string;
  referenceId?: string;
  questionContent: string;
  askerName?: string;
  askerEmail?: string;
  category?: string;
  createdAt?: string;
  status?: string;
  approvedForPublish: boolean;
  consentToPublish: boolean;
  answers: AdminAnswer[];
}

export async function getAllQuestions(): Promise<{ questions: AdminQuestion[] }> {
  const [questionsData, answersData] = await Promise.all([
    airtableFetch('שאלות', {}, [{ field: 'תאריך', direction: 'desc' }]),
    airtableFetch('תשובות', { filterByFormula: 'NOT({שאלה}="")' }).catch(() => ({ records: [] })),
  ]);

  const questions: AdminQuestion[] = questionsData.records.map((r: any) => {
    const f = r.fields;
    const linkedAnswerIds: string[] = f['תשובות'] ?? [];
    const answers: AdminAnswer[] = answersData.records
      .filter((a: any) => linkedAnswerIds.includes(a.id))
      .map((a: any) => ({
        id: a.id,
        content: a.fields['תוכן התשובה'] ?? '',
        writerType: a.fields['סוג כותב'] ?? 'רב',
        date: a.fields['תאריך'],
      }))
      .sort((a: AdminAnswer, b: AdminAnswer) =>
        (a.date ?? '').localeCompare(b.date ?? '')
      );

    return {
      id: r.id,
      referenceId: f['מזהה שאלה'],
      questionContent: f['תוכן השאלה'] ?? '',
      askerName: f['שם השואל'],
      askerEmail: f['אימייל השואל'],
      category: Array.isArray(f['קטגוריה']) ? f['קטגוריה'][0] : undefined,
      createdAt: f['תאריך'],
      status: f['סטטוס'] ?? 'ממתין',
      approvedForPublish: f['מאושר לפרסום'] === true,
      consentToPublish: f['הסכמה לפרסום'] === true,
      answers,
    };
  });

  return { questions };
}

export async function approveQuestion(questionId: string) {
  return airtableUpdate('שאלות', questionId, { 'מאושר לפרסום': true });
}

export async function rejectQuestion(questionId: string) {
  return airtableUpdate('שאלות', questionId, { 'סטטוס': 'נדחה' });
}

export async function markAnswered(questionId: string) {
  return airtableUpdate('שאלות', questionId, { 'סטטוס': 'נענה' });
}

export async function createQuestion(input: {
  content: string;
  askerName?: string;
  category?: string;
  status?: string;
  consentToPublish?: boolean;
  approvedForPublish?: boolean;
}): Promise<{ id: string }> {
  const fields: Record<string, unknown> = {
    'תוכן השאלה': input.content,
    'סטטוס': input.status ?? 'ממתין',
    'הסכמה לפרסום': input.consentToPublish ?? false,
    'מאושר לפרסום': input.approvedForPublish ?? false,
    'תאריך': new Date().toISOString().split('T')[0],
  };
  if (input.askerName?.trim()) fields['שם השואל'] = input.askerName.trim();
  if (input.category) fields['קטגוריה'] = [input.category];
  const record = await airtableCreate('שאלות', fields);
  return { id: record.id };
}

export async function updateQuestion(questionId: string, fields: Record<string, unknown>) {
  return airtableUpdate('שאלות', questionId, fields);
}

export async function deleteQuestion(questionId: string) {
  return airtableDelete('שאלות', questionId);
}

export async function updateAnswer(answerId: string, content: string) {
  return airtableUpdate('תשובות', answerId, { 'תוכן התשובה': content });
}

export async function deleteAnswer(answerId: string) {
  return airtableDelete('תשובות', answerId);
}

export { submitReply };
