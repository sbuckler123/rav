import { useQuery } from '@tanstack/react-query';
import { getArticles } from '@/api/getArticles';
import { getVideos } from '@/api/getVideos';
import { getEvents } from '@/api/getEvents';
import { getShiurim } from '@/api/getShiurim';
import { getPublishedQuestions } from '@/api/getPublishedQuestions';
import { getAlHaperekList } from '@/api/getAlHaperek';

export const QUERY_KEYS = {
  articles: ['articles'] as const,
  videos: ['videos'] as const,
  events: ['events'] as const,
  shiurim: ['shiurim'] as const,
  questions: (categoryId?: string) => ['questions', categoryId ?? ''] as const,
  alHaperek: ['alHaperek'] as const,
};

export function useArticles() {
  return useQuery({
    queryKey: QUERY_KEYS.articles,
    queryFn: getArticles,
  });
}

export function useVideos() {
  return useQuery({
    queryKey: QUERY_KEYS.videos,
    queryFn: getVideos,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: getEvents,
  });
}

export function useShiurim() {
  return useQuery({
    queryKey: QUERY_KEYS.shiurim,
    queryFn: getShiurim,
  });
}

export function useAlHaperek() {
  return useQuery({
    queryKey: QUERY_KEYS.alHaperek,
    queryFn: getAlHaperekList,
  });
}

export function useQuestions(categoryId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.questions(categoryId),
    queryFn: () => getPublishedQuestions({ categoryId }),
  });
}
