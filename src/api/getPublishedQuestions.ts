import { airtableFetch } from './airtable';

export async function getPublishedQuestions(input?: { categoryId?: string }): Promise<{
  questions: Array<{
    id: string;
    referenceId: any;
    questionContent: string;
    askerName?: string;
    category?: string;
    createdAt?: string;
    answers: Array<{
      id: string;
      content: string;
      writerType: string;
      date?: any;
    }>;
  }>;
}> {
  // שליפת שאלות מפורסמות
  const params: Record<string, string> = {
    filterByFormula: "AND({הסכמה לפרסום}=TRUE(),{מאושר לפרסום}=TRUE(),NOT({סטטוס}='נדחה'))",
  };

  const questionsData = await airtableFetch('שאלות', params);

  // שליפת תשובות — graceful fallback if table doesn't exist yet
  const answersData = await airtableFetch('תשובות', {
    filterByFormula: 'NOT({שאלה}="")',
  }).catch(() => ({ records: [] }));

  const questions = questionsData.records
    .filter((r: any) => {
      if (!input?.categoryId) return true;
      const linked = r.fields['קטגוריה'];
      return Array.isArray(linked) && linked.includes(input.categoryId);
    })
    .map((r: any) => {
      const linkedAnswerIds: string[] = r.fields['תשובות'] ?? [];
      const answers = answersData.records
        .filter((a: any) => linkedAnswerIds.includes(a.id))
        .map((a: any) => ({
          id: a.id,
          content: a.fields['תוכן התשובה'] ?? '',
          writerType: a.fields['סוג כותב'] ?? 'רב',
          date: a.fields['תאריך'],
        }));

      return {
        id: r.id,
        referenceId: r.fields['מזהה שאלה'],
        questionContent: r.fields['תוכן השאלה'] ?? '',
        askerName: r.fields['שם השואל'],
        category: Array.isArray(r.fields['קטגוריה']) ? r.fields['קטגוריה'][0] : undefined,
        createdAt: r.fields['תאריך הגשה'],
        answers,
      };
    });

  return { questions };
}
