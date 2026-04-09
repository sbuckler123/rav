export async function submitQuestion(input: {
  name: string;
  email: string;
  categoryId?: string;
  topic?: string;
  question: string;
  allowPublic: boolean;
}): Promise<{ success: boolean; id?: string; referenceId?: string }> {
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      categoryId: input.categoryId,
      question: input.question,
      allowPublic: input.allowPublic,
    }),
  });
  if (!res.ok) throw new Error(`Failed to submit question: ${res.status}`);
  return res.json();
}
