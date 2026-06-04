/**
 * יומן רבנות — צבעי תגיות סוג אירוע
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
