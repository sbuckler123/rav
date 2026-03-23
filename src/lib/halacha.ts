/**
 * פסקי הלכה — קטגוריות, צבעים, נתונים ופונקציות עזר
 */

export const CATEGORIES = [
  'שבת',
  'כשרות',
  'ברכות',
  'נישואין',
  'טהרת המשפחה',
  'יום טוב',
  'אבלות',
  'תפילה',
] as const;

export type HalachaCategory = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<HalachaCategory, string> = {
  'שבת': '#4A90E2',
  'כשרות': '#50C878',
  'ברכות': '#9B59B6',
  'נישואין': '#E91E63',
  'טהרת המשפחה': '#00ACC1',
  'יום טוב': '#FF9800',
  'אבלות': '#607D8B',
  'תפילה': '#8E44AD',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as HalachaCategory] ?? '#002D72';
}

export const YEARS = ['תשפ"ה', 'תשפ"ד', 'תשפ"ג', 'תשפ"ב'];

export interface HalachaListItem {
  id: string;
  slug: string;
  title: string;
  category: HalachaCategory;
  dateHebrew: string;
  dateLocale: string;
  excerpt: string;
}

export interface HalachaDetail extends HalachaListItem {
  content: string[];
  sources: string[];
  relatedQuestions: string[];
}

export const HALACHA_LIST: HalachaDetail[] = [
  {
    id: '1',
    slug: 'shabbat-electricity-use',
    title: 'שימוש בחשמל בשבת - הדלקה וכיבוי',
    category: 'שבת',
    dateHebrew: 'כ"ג טבת תשפ"ה',
    dateLocale: '23.1.2025',
    excerpt: 'פסק הלכה מפורט בנוגע לשימוש בחשמל בשבת, לרבות הדלקה וכיבוי של מכשירים חשמליים.',
    content: [
      'שאלה: האם מותר להדליק ולכבות חשמל בשבת?',
      'תשובה: אסור להדליק ולכבות חשמל בשבת מדין בונה וסותר, וכן משום מבעיר ומכבה.',
    ],
    sources: ['שולחן עורך אורח חיים סימן שכ"ד', 'אגרות משה אורח חיים חלק ד סימן ס'],
    relatedQuestions: ['שימוש בטיימר בשבת', 'פתיחת דלת מקרר בשבת'],
  },
  {
    id: '2',
    slug: 'kashrut-checking-vegetables',
    title: 'בדיקת ירקות מחרקים',
    category: 'כשרות',
    dateHebrew: 'י"ח טבת תשפ"ה',
    dateLocale: '18.1.2025',
    excerpt: 'הנחיות מפורטות לבדיקת ירקות שונים מחרקים והכשרתם לשימוש.',
    content: [
      'שאלה: כיצד יש לבדוק ירקות עלים מחרקים?',
      'תשובה: יש לבדוק כל עלה לאור חזק, ולהקפיד על שטיפה יסודית במים עם סבון או חומר ניקוי.',
    ],
    sources: ['שולחן עורך יורה דעה סימן פ"ד', 'משנה ברורה'],
    relatedQuestions: ['בדיקת תותים', 'בדיקת קמח'],
  },
  {
    id: '3',
    slug: 'blessings-order-multiple-foods',
    title: 'סדר ברכות במגוון מאכלים',
    category: 'ברכות',
    dateHebrew: 'ט"ו טבת תשפ"ה',
    dateLocale: '15.1.2025',
    excerpt: 'הסבר מפורט על סדר עדיפויות בברכות כאשר יש מספר מאכלים על השולחן.',
    content: [
      'שאלה: מה הסדר הנכון לברך על מספר מאכלים?',
      'תשובה: יש להקדים את הברכה על המאכל החשוב יותר לפי סדר שבעת המינים, ולאחר מכן לפי חשיבות המאכל.',
    ],
    sources: ['שולחן עורך אורח חיים סימן רי"א', 'משנה ברורה שם'],
    relatedQuestions: ['ברכה על פירות', 'ברכה אחרונה'],
  },
];

export function getHalachaBySlug(slug: string): HalachaDetail | undefined {
  return HALACHA_LIST.find((h) => h.slug === slug);
}

export function getHalachaById(id: string): HalachaDetail | undefined {
  return HALACHA_LIST.find((h) => h.id === id);
}

export function getHalachaEntry(id: string): HalachaDetail | undefined {
  return getHalachaBySlug(id) ?? getHalachaById(id);
}
