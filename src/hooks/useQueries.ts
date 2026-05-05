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

export const ADMIN_QUERY_KEYS = {
  articles:          ['admin', 'articles']          as const,
  videos:            ['admin', 'videos']            as const,
  events:            ['admin', 'events']            as const,
  shiurim:           ['admin', 'shiurim']           as const,
  alHaperek:         ['admin', 'al-haperek']        as const,
  questions:         ['admin', 'questions']         as const,
  users:             ['admin', 'users']             as const,
  settings:          ['admin', 'settings']          as const,
  categoriesAdmin:   ['admin', 'categories']        as const,
  writerTypeChoices: ['admin', 'writerTypeChoices'] as const,
  eventTypeChoices:  ['admin', 'eventTypeChoices']  as const,
  categoriesByTable: (forTable: string) => ['categories', forTable] as const,
};

// Admin is the only writer to admin data, so freshness is driven entirely by
// invalidate-on-mutation. No need for time-based revalidation or refetch on focus.
export const ADMIN_QUERY_OPTIONS = {
  staleTime: Infinity,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

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
