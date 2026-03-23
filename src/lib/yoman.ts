/**
 * יומן רבנות — צבעי תגיות סוג אירוע, נתונים ופונקציות עזר
 */

export const EVENT_TYPES = [
  'פגישה דיפלומטית',
  'ביקור קהילות',
  'טקס ממלכתי',
  'כנס',
  'אירוע ציבורי',
  'ביקור רבנים',
  'סיור',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** רקע + טקסט לכל סוג אירוע */
export const EVENT_TYPE_COLORS: Record<
  EventType,
  { bg: string; text: string }
> = {
  'פגישה דיפלומטית': { bg: '#DBEAFE', text: '#1B2A4A' },
  'ביקור קהילות': { bg: '#D1FAE5', text: '#065F46' },
  'טקס ממלכתי': { bg: '#FEF3C7', text: '#92400E' },
  כנס: { bg: '#EDE9FE', text: '#5B21B6' },
  'אירוע ציבורי': { bg: '#FCE7F3', text: '#9D174D' },
  'ביקור רבנים': { bg: '#E0E7FF', text: '#3730A3' },
  סיור: { bg: '#CCFBF1', text: '#115E59' },
};

export function getEventTypeStyle(type: string): { bg: string; text: string } {
  return (
    EVENT_TYPE_COLORS[type as EventType] ?? { bg: '#E5E7EB', text: '#2D2D2D' }
  );
}

export const YOMAN_YEARS = ['תשפ"ה', 'תשפ"ד', 'תשפ"ג', 'תשפ"ב'];

export const YOMAN_MONTHS = [
  'תשרי',
  'חשוון',
  'כסלו',
  'טבת',
  'שבט',
  'אדר',
  'ניסן',
  'אייר',
  'סיוון',
  'תמוז',
  'אב',
  'אלול',
];

export const SORT_OPTIONS = [
  { value: 'date-desc', label: 'תאריך (חדש לישן)' },
  { value: 'date-asc', label: 'תאריך (ישן לחדש)' },
];

export interface YomanParticipant {
  name: string;
  role: string;
  image?: string;
}

export interface YomanQuote {
  text: string;
  author: string;
}

export interface YomanScheduleItem {
  time: string;
  description: string;
}

export interface YomanGalleryImage {
  url: string;
  caption: string;
}

export interface YomanListItem {
  id: string;
  slug: string;
  title: string;
  eventType: EventType;
  dateHebrew: string;
  dateLocale: string;
  location: string;
  duration: string;
  excerpt: string;
  participantsShort: string[];
  imagePlaceholder?: boolean;
}

export interface YomanDetail extends YomanListItem {
  description: string[];
  participants: YomanParticipant[];
  quotes: YomanQuote[];
  schedule?: YomanScheduleItem[];
  gallery: YomanGalleryImage[];
  mainImagePlaceholder?: boolean;
}

const placeholderImage = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w2000.org/svg" width="120" height="80" viewBox="0 0 120 80" fill="%23E5E7EB"><rect width="120" height="80" fill="%23E5E7EB"/><path d="M60 32c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="%236B7280"/><path d="M76 56H44c-2.2 0-4-1.8-4-4v-2l8-8 6 6 10-12 14 20v0c0 2.2-1.8 4-4 4z" fill="%236B7280"/></svg>'
);

export const YOMAN_LIST: YomanDetail[] = [
  {
    id: '1',
    slug: 'pgisha-rabanei-arim-chadashim',
    title: 'הרבנים הראשיים לישראל נפגשו עם רבני הערים שנבחרו לאחרונה וברכו אותם בהצלחה רבה בתפקידם החדש',
    eventType: 'ביקור רבנים',
    dateHebrew: 'כ"ה טבת תשפ"ו',
    dateLocale: '25.1.2026',
    location: 'לשכת הרב הראשי, ירושלים',
    duration: 'פגישה',
    excerpt:
      'הרב הראשי לישראל הראשון לציון, הרב דוד יוסף שליט"א, והרב הראשי לישראל, הרב קלמן מאיר בר שליט"א, אירחו היום בלשכתם את רבני הערים שנבחרו לאחרונה לתפקידם.',
    participantsShort: ['הרב דוד יוסף', 'הרב קלמן מאיר בר', 'רבני הערים'],
    imagePlaceholder: false,
    description: [
      'הרבנים הראשיים לישראל נפגשו עם רבני הערים שנבחרו לאחרונה וברכו אותם בהצלחה רבה בתפקידם החדש.',
      'הרב הראשי לישראל הראשון לציון, הרב דוד יוסף שליט"א, והרב הראשי לישראל, הרב קלמן מאיר בר שליט"א, אירחו היום בלשכתם את רבני הערים שנבחרו לאחרונה לתפקידם.',
    ],
    participants: [
      { name: 'הרב דוד יוסף', role: 'הרב הראשי לישראל הראשון לציון' },
      { name: 'הרב קלמן מאיר בר', role: 'הרב הראשי לישראל' },
      { name: 'רבני הערים שנבחרו לאחרונה', role: 'רבני ערים' },
    ],
    quotes: [],
    gallery: [
      { url: 'https://images.fillout.com/orgid-590181/flowpublicid-faiasrbeba/widgetid-default/6bvTG1xXn1XmEduu5WX5Gs/pasted-image-1771326073957.png', caption: 'הרבנים הראשיים לישראל עם רבני הערים שנבחרו לאחרונה' },
    ],
    mainImagePlaceholder: false,
  },
];

export function getYomanBySlug(slug: string): YomanDetail | undefined {
  return YOMAN_LIST.find((e) => e.slug === slug);
}

export function getYomanById(id: string): YomanDetail | undefined {
  return YOMAN_LIST.find((e) => e.id === id);
}

export function getYomanEntry(id: string): YomanDetail | undefined {
  return getYomanBySlug(id) ?? getYomanById(id);
}

export function getPrevNextYoman(currentSlug: string): {
  prev: YomanListItem | null;
  next: YomanListItem | null;
} {
  const idx = YOMAN_LIST.findIndex((e) => e.slug === currentSlug);
  if (idx < 0)
    return { prev: null, next: null };
  return {
    prev: idx > 0 ? YOMAN_LIST[idx - 1] : null,
    next: idx < YOMAN_LIST.length - 1 && idx >= 0 ? YOMAN_LIST[idx + 1] : null,
  };
}

export function getEventTypeCounts(): Record<EventType, number> {
  const counts = {} as Record<EventType, number>;
  EVENT_TYPES.forEach((t) => {
    counts[t] = YOMAN_LIST.filter((e) => e.eventType === t).length;
  });
  return counts;
}

export function getMonthArchive(): { month: string; year: string; count: number }[] {
  const byKey: Record<string, number> = {};
  YOMAN_LIST.forEach((e) => {
    const key = `${e.dateHebrew.split(' ')[1]} ${e.dateHebrew.split(' ')[2]}`;
    byKey[key] = (byKey[key] ?? 0) + 1;
  });
  return Object.entries(byKey).map(([key, count]) => {
    const [month, year] = key.split(' ');
    return { month, year, count };
  }).sort((a, b) => {
    const order = YOMAN_YEARS.indexOf(b.year as (typeof YOMAN_YEARS)[number]) - YOMAN_YEARS.indexOf(a.year as (typeof YOMAN_YEARS)[number]);
    if (order !== 0) return order;
    return YOMAN_MONTHS.indexOf(b.month) - YOMAN_MONTHS.indexOf(a.month);
  });
}
