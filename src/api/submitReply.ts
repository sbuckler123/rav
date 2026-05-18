// Submit a reply to a question — proxied through /api/admin?section=questions.
//
// Goes through apiFetch so an admin's Clerk bearer token is auto-attached when
// available. Anonymous callers (the public Q&A follow-up form) send no token
// and hit the public-reply branch on the server. The server distinguishes by
// presence of a verified token, NOT by the caller.

import { apiFetch } from './apiFetch';

export async function submitReply(input: {
  questionId: string;
  content: string;
  writerType?: string;
  title?: string;
  turnstileToken?: string | null;
}): Promise<{ success: boolean; id?: string }> {
  return apiFetch<{ success: boolean; id?: string }>(
    '/api/admin?section=questions&type=reply',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId:     input.questionId,
        content:        input.content,
        writerType:     input.writerType,
        title:          input.title,
        turnstileToken: input.turnstileToken ?? undefined,
      }),
    },
  );
}
