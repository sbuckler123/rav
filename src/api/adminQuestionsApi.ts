import { airtableFetch, airtableUpdate } from './airtable';
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
    airtableFetch('שאלות', {}, [{ field: 'תאריך הגשה', direction: 'desc' }]),
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
      createdAt: f['תאריך הגשה'],
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

export { submitReply };
