export async function getPublishedQuestions(input?: { category?: string }): Promise<{
  questions: Array<{
    referenceId: string;
    questionContent: string;
    category?: string;
    createdAt?: string;
    followUpBlocked?: boolean;
    answers: Array<{
      title?: string;
      content: string;
      writerType: string;
      date?: any;
    }>;
  }>;
}> {
  const url = input?.category
    ? `/api/questions?category=${encodeURIComponent(input.category)}`
    : '/api/questions';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`);
  return res.json();
}
