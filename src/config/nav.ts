export const NAV_LINKS = [
  { href: '/shiurei-torah', label: 'שיעורי תורה',  desc: 'ארכיון שיעורי וידאו ואודיו' },
  { href: '/hagut-upsika', label: 'הגות ופסיקה',   desc: 'מאמרי הגות, חידושים וביאורים בהלכה, פסקי דין מורחבים' },
  { href: '/shut',          label: 'שו"ת',          desc: 'ארכיון מענה הלכתי לשאלות הציבור' },
  { href: '/idkunim',      label: 'עדכונים',        desc: 'עדכונים אקטואליים, מכתבים לציבור, ופסקי השעה' },
  { href: '/luach-iruyim', label: 'לוח אירועים',   desc: 'שיעורים וכנסים מתוכננים' },
  { href: '/odot',          label: 'אודות',          desc: '' },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];

/** Lookup: route href → subtitle description */
export const PAGE_DESC: Record<string, string> = Object.fromEntries(
  NAV_LINKS.map((l) => [l.href, l.desc])
);
