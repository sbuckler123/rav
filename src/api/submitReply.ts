// Submit a reply to a question — proxied through /api/admin?section=questions

export async function submitReply(input: {
  questionId: string;
  content: string;
  writerType?: string;
  title?: string;
}): Promise<{ success: boolean; id?: string }> {
  const res = await fetch('/api/admin?section=questions&type=reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Reply submission failed: ${res.status}`);
  return res.json() as Promise<{ success: boolean; id?: string }>;
}
