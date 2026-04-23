import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Search, X, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { PAGE_DESC } from '@/config/nav';
import { getShiurim, type ShiurEvent } from '@/api/getShiurim';

const dateFilters = [
  { label: 'הכל',      value: 'all' },
  { label: 'השבוע',   value: 'week' },
  { label: 'החודש',   value: 'month' },
];

const monthNames = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];

const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const HEBREW_NUMERALS: Record<number, string> = {
  1:'א׳', 2:'ב׳', 3:'ג׳', 4:'ד׳', 5:'ה׳', 6:'ו׳', 7:'ז׳', 8:'ח׳', 9:'ט׳', 10:'י׳',
  11:'י״א', 12:'י״ב', 13:'י״ג', 14:'י״ד', 15:'ט״ו', 16:'ט״ז', 17:'י״ז', 18:'י״ח',
  19:'י״ט', 20:'כ׳', 21:'כ״א', 22:'כ״ב', 23:'כ״ג', 24:'כ״ד', 25:'כ״ה', 26:'כ״ו',
  27:'כ״ז', 28:'כ״ח', 29:'כ״ט', 30:'ל׳',
};
const hebrewDayFmt   = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' });
const hebrewMonthFmt = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' });
const toHebrewDate = (dateStr: string): string => {
  try {
    const d = parseDate(dateStr);
    const dayNum = parseInt(hebrewDayFmt.format(d), 10);
    const month  = hebrewMonthFmt.format(d);
    const dayHeb = HEBREW_NUMERALS[dayNum] ?? String(dayNum);
    return `${dayHeb} ${month}`;
  } catch { return ''; }
};

const isPastShiur = (event: ShiurEvent): boolean => {
  const base = event.dateRaw ? new Date(event.dateRaw) : parseDate(event.date);
  const d = new Date(base);
  const timeMatch = event.time?.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    d.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
  } else {
    d.setHours(23, 59, 59, 0);
  }
  return d < new Date();
};

const isTodayShiur = (event: ShiurEvent): boolean => {
  const now = new Date();
  const base = event.dateRaw ? new Date(event.dateRaw) : parseDate(event.date);
  return (
    base.getFullYear() === now.getFullYear() &&
    base.getMonth() === now.getMonth() &&
    base.getDate() === now.getDate()
  );
};

export default function ShiurimPage() {
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [events, setEvents]   = useState<ShiurEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getShiurim()
      .then(({ shiurim }) => setEvents(shiurim))
      .catch(() => setError('שגיאה בטעינת השיעורים'))
      .finally(() => setLoading(false));
  }, []);

  const allCategories = useMemo(
    () => ['הכל', ...new Set(events.map(e => e.category).filter(Boolean))],
    [events]
  );

  const filteredEvents = useMemo(() => {
    const now          = new Date();
    const weekFromNow  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return events.filter(event => {
      const q           = searchQuery.trim().toLowerCase();
      const searchMatch = !q || event.title.toLowerCase().includes(q)
        || event.description.toLowerCase().includes(q)
        || event.location.toLowerCase().includes(q);
      const catMatch  = selectedCategory === 'הכל' || event.category === selectedCategory;
      const eventDate = parseDate(event.date);
      let dateMatch   = true;
      if (selectedDateFilter === 'week')  dateMatch = eventDate >= now && eventDate <= weekFromNow;
      if (selectedDateFilter === 'month') dateMatch = eventDate >= now && eventDate <= monthFromNow;
      return searchMatch && catMatch && dateMatch;
    });
  }, [events, searchQuery, selectedCategory, selectedDateFilter]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'הכל' || selectedDateFilter !== 'all';
  const clearAll = () => { setSearchQuery(''); setSelectedCategory('הכל'); setSelectedDateFilter('all'); };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="לוח אירועים"
        description="לוח האירועים העדכני של הרב קלמן מאיר בר — שיעורים, הרצאות ומפגשים."
      />
      <PageHeader title="לוח אירועים" subtitle={PAGE_DESC['/luach-iruyim']} />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">

        {/* ── Mobile filters (above list) ── */}
        <div className="lg:hidden mb-6 space-y-3">
          {/* Mobile search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="חיפוש שם, מיקום..."
              className="pr-9 bg-white border-border"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Mobile filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {dateFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setSelectedDateFilter(f.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedDateFilter === f.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-muted-foreground border-border hover:border-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
            {allCategories.filter(c => c !== 'הכל').map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'הכל' : cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-secondary text-primary border-secondary'
                    : 'bg-white text-muted-foreground border-border hover:border-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              נקה סינון
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Main content ── */}
          <main className="lg:col-span-3" aria-label="רשימת שיעורים">

            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="font-serif font-bold text-xl text-primary">שיעורים קרובים</h2>
                <span className="bg-secondary/15 text-secondary text-xs font-semibold px-2.5 py-1 rounded-full">
                  {loading ? '...' : filteredEvents.length}
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  נקה סינון
                </button>
              )}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <Card className="text-center py-12 bg-[#FAF8F2]">
                <CardContent>
                  <p className="text-destructive text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!loading && !error && filteredEvents.length === 0 && (
              <Card className="text-center py-16 bg-[#FAF8F2]">
                <CardContent>
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">לא נמצאו שיעורים התואמים לחיפוש</p>
                  <Button variant="outline" onClick={clearAll} className="min-h-[44px]">
                    נקה פילטרים
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Shiurim list */}
            {!loading && !error && filteredEvents.length > 0 && (
              <div className="space-y-4">
                {filteredEvents.map(event => {
                  const [day, month] = event.date.split('.');
                  const monthLabel = monthNames[parseInt(month) - 1];
                  const hebrewDate = toHebrewDate(event.date);
                  const past   = isPastShiur(event);
                  const today  = isTodayShiur(event);
                  const todayUpcoming = today && !past;
                  return (
                    <Link key={event.id} to={`/luach-iruyim/${event.linkId}`}>
                      <Card className={`overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer border-2 ${
                        todayUpcoming ? 'border-secondary shadow-md'
                        : past        ? 'border-border/50 opacity-60 hover:opacity-80'
                        :               'border-border'
                      }`}>
                        <CardContent className="p-0">
                          <div className="flex">

                            {/* Date block */}
                            <div className={`flex-shrink-0 w-[84px] sm:w-24 flex flex-col items-center justify-center py-4 sm:py-5 px-1.5 gap-0.5 ${
                              past ? 'bg-muted text-muted-foreground' : 'bg-primary text-white'
                            }`}>
                              <span className="text-2xl sm:text-4xl font-bold leading-none">{day}</span>
                              <span className="text-[11px] sm:text-xs font-medium opacity-80 tracking-wide">{monthLabel}</span>
                              {hebrewDate && (
                                <span className="text-[9px] sm:text-[10px] opacity-70 leading-tight text-center w-full px-1 break-words">{hebrewDate}</span>
                              )}
                              {todayUpcoming && (
                                <span className="mt-1 text-[9px] font-bold text-secondary bg-white/20 rounded-full px-1.5 py-0.5 leading-none">
                                  היום
                                </span>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 p-4 sm:p-5">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className={`font-serif font-bold text-base sm:text-lg leading-snug transition-colors ${past ? 'text-muted-foreground' : 'text-primary group-hover:text-secondary'}`}>
                                  {event.title}
                                </h3>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {todayUpcoming && (
                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-secondary/15 border border-secondary/30 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                                      <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                                      היום
                                    </span>
                                  )}
                                  {past && (
                                    <span className="hidden sm:inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      התקיים
                                    </span>
                                  )}
                                  {event.category && (
                                    <Badge variant="secondary" className={`text-xs hidden sm:inline-flex ${past ? 'opacity-60' : ''}`}>
                                      {event.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {event.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                                  {event.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {event.time && (
                                  <span className="flex items-center gap-1.5">
                                    <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${past ? 'text-muted-foreground/60' : 'text-secondary'}`} />
                                    {event.time}
                                  </span>
                                )}
                                {event.location && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${past ? 'text-muted-foreground/60' : 'text-secondary'}`} />
                                    <span className="truncate">{event.location}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center px-3 sm:px-4 text-muted-foreground group-hover:text-secondary transition-colors flex-shrink-0">
                              <ChevronLeft className="h-4 w-4" />
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block space-y-6" aria-label="סינון שיעורים">
            <div className="sticky top-24 space-y-4">

              {/* Search */}
              <Card className="bg-[#FAF8F2]">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4 text-secondary" />
                    חיפוש
                  </h3>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="שם, מיקום..."
                      className="pr-9 bg-white border-border"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Date filter */}
              <Card className="bg-[#FAF8F2]">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-secondary" />
                    טווח תאריכים
                  </h3>
                  <div className="flex rounded-lg overflow-hidden border border-border">
                    {dateFilters.map((f, i) => (
                      <button
                        key={f.value}
                        onClick={() => setSelectedDateFilter(f.value)}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${
                          i < dateFilters.length - 1 ? 'border-l border-border' : ''
                        } ${
                          selectedDateFilter === f.value
                            ? 'bg-primary text-white'
                            : 'bg-white text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category filter */}
              {allCategories.length > 1 && (
                <Card className="bg-[#FAF8F2]">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-sm text-primary mb-3">קטגוריה</h3>
                    <ul className="space-y-1" role="list">
                      {allCategories.map(cat => (
                        <li key={cat}>
                          <button
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-right text-sm py-1.5 px-2 rounded-md transition-colors flex items-center justify-between ${
                              selectedCategory === cat
                                ? 'text-secondary font-semibold bg-secondary/10'
                                : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                            }`}
                          >
                            {cat}
                            {selectedCategory === cat && (
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="w-full text-sm text-muted-foreground hover:text-destructive flex items-center justify-center gap-1.5 py-2 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  נקה את כל הפילטרים
                </button>
              )}
            </div>
          </aside>

        </div>

      </div>
    </div>
  );
}
