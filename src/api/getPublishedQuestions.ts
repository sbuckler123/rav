export async function getPublishedQuestions(input?: { categoryId?: string }): Promise<{
  questions: Array<{
    id: string;
    referenceId: any;
    questionContent: string;
    category?: string;
    createdAt?: string;
    followUpBlocked?: boolean;
    answers: Array<{
      id: string;
      title?: string;
      content: string;
      writerType: string;
      date?: any;
    }>;
  }>;
}> {
  const url = input?.categoryId
    ? `/api/questions?categoryId=${encodeURIComponent(input.categoryId)}`
    : '/api/questions';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`);
  return res.json();
}
