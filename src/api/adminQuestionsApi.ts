// All Airtable access is now server-side via /api/admin?section=questions
import { apiFetch } from './apiFetch';

export interface AdminAnswer {
  id: string;
  title?: string;
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
  const questions = await apiFetch<AdminQuestion[]>('/api/admin?section=questions');
  return { questions };
}

export async function approveQuestion(questionId: string) {
  return apiFetch(`/api/admin?section=questions&id=${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { 'מאושר לפרסום': true } }),
  });
}

export async function rejectQuestion(questionId: string) {
  return apiFetch(`/api/admin?section=questions&id=${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { 'סטטוס': 'נדחה' } }),
  });
}

export async function markAnswered(questionId: string) {
  return apiFetch(`/api/admin?section=questions&id=${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { 'סטטוס': 'נענה' } }),
  });
}

export async function createQuestion(input: {
  content: string;
  askerName?: string;
  category?: string;
  status?: string;
  consentToPublish?: boolean;
  approvedForPublish?: boolean;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/api/admin?section=questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateQuestion(questionId: string, fields: Record<string, unknown>) {
  return apiFetch(`/api/admin?section=questions&id=${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

export async function deleteQuestion(questionId: string) {
  return apiFetch(`/api/admin?section=questions&id=${questionId}`, { method: 'DELETE' });
}

export async function updateAnswer(answerId: string, content: string, title?: string) {
  return apiFetch(`/api/admin?section=questions&type=answer&id=${answerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, ...(title !== undefined && { title }) }),
  });
}

export async function deleteAnswer(answerId: string) {
  return apiFetch(`/api/admin?section=questions&type=answer&id=${answerId}`, { method: 'DELETE' });
}

export async function getWriterTypeChoices(): Promise<string[]> {
  return apiFetch<string[]>('/api/admin?section=questions&type=fieldChoices');
}

export { submitReply } from './submitReply';
