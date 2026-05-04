import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, CalendarDays, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { PAGE_DESC } from '@/config/nav';
import { type EventItem } from '@/api/getEvents';
import { useEvents } from '@/hooks/useQueries';
import { getEventTypeStyle } from '@/lib/yoman';

// ─── helpers ─────────────────────────────────────────────────────────────────

const PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="%231B2A4A"/><polygon points="140,70 140,140 200,105" fill="%23C9A84C"/></svg>'
);

function formatDate(iso: string): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
  return iso;
}

function groupByMonth(events: EventItem[]): { key: string; label: string; events: EventItem[] }[] {
  const map = new Map<string, EventItem[]>();
  for (const e of events) {
    const d = e.dateLocale ? new Date(e.dateLocale) : null;
    const key = d && !isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : 'no-date';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === 'no-date') return 1;
      if (b === 'no-date') return -1;
      return b.localeCompare(a);
    })
    .map(([key, evts]) => {
      // Sort events within each month: newest first
      const sorted = [...evts].sort((a, b) => {
        if (!a.dateLocale) return 1;
        if (!b.dateLocale) return -1;
        return b.dateLocale.localeCompare(a.dateLocale);
      });
      if (key === 'no-date') return { key, label: 'ללא תאריך', events: sorted };
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleString('he-IL', { month: 'long', year: 'numeric' });
      return { key, label, events: sorted };
    });
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  if (!type) return null;
  const style = getEventTypeStyle(type);
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {type}
    </span>
  );
}

function MonthHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-7 bg-secondary rounded-full flex-shrink-0" />
      <h2 className="text-lg font-serif font-bold text-primary">{label}</h2>
      <div className="flex-1 h-px bg-border" />
      <span className="text-sm text-muted-foreground flex-shrink-0">
        {count} {count === 1 ? 'אירוע' : 'אירועים'}
      </span>
    </div>
  );
}

/** Large featured card — first event in each month group */
function FeaturedCard({ event }: { event: EventItem }) {
  const img = event.mainImageUrl || PLACEHOLDER;
  return (
    <Link to={`/yoman-peilut/${event.linkId}`} className="block group">
      <div className="rounded-xl border border-border bg-white overflow-hidden hover:shadow-md transition-all duration-200">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr]">
          {/* Image */}
          <div className="relative h-56 md:h-auto min-h-[200px] bg-primary flex-shrink-0">
            <img
              src={img}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute top-3 right-3">
              <TypeBadge type={event.eventType} />
            </div>
          </div>

          {/* Content */}
          <div className="p-5 md:p-7 flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-xl md:text-2xl text-primary mb-3 line-clamp-3 group-hover:text-secondary transition-colors leading-snug">
                {event.title}
              </h3>
              {event.excerpt && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {event.excerpt}
                </p>
              )}
            </div>
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div className="space-y-1 text-xs text-muted-foreground">
                {event.dateLocale && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                    {formatDate(event.dateLocale)}
                    {event.dateHebrew && <span className="text-muted-foreground/70">· {event.dateHebrew}</span>}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {event.location}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-secondary group-hover:underline flex-shrink-0">
                קרא עוד ←
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Compact card — remaining events in a month */
function EventCard({ event }: { event: EventItem }) {
  const img = event.mainImageUrl || PLACEHOLDER;
  return (
    <Link to={`/yoman-peilut/${event.linkId}`} className="block group h-full">
      <div className="rounded-xl border border-border bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-primary flex-shrink-0 overflow-hidden">
          <img
            src={img}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <TypeBadge type={event.eventType} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-serif font-bold text-primary mb-2 line-clamp-2 group-hover:text-secondary transition-colors text-base leading-snug">
            {event.title}
          </h3>
          {event.excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3 flex-1">
              {event.excerpt}
            </p>
          )}
          <div className="mt-auto pt-2.5 border-t border-border/50 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {event.dateLocale && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3 flex-shrink-0" />
                {formatDate(event.dateLocale)}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl py-8 space-y-10">
      <div className="h-24 bg-muted animate-pulse rounded-xl" />
      {[0, 1].map(i => (
        <div key={i} className="space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded w-40" />
          <div className="h-52 bg-muted animate-pulse rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(j => (
              <div key={j} className="rounded-xl border border-border overflow-hidden bg-white">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-full" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { data, isLoading, isError } = useEvents();
  const events: EventItem[] = data?.events ?? [];

  const allTypes = useMemo(
    () => [...new Set(events.map(e => e.eventType).filter(Boolean))],
    [events],
  );

  const filtered = useMemo(() => {
    let list = [...events];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.excerpt.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.participantsShort.some(p => p.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== 'all') list = list.filter(e => e.eventType === typeFilter);
    // Always newest first regardless of API order
    list.sort((a, b) => {
      if (!a.dateLocale) return 1;
      if (!b.dateLocale) return -1;
      return b.dateLocale.localeCompare(a.dateLocale);
    });
    return list;
  }, [events, searchQuery, typeFilter]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);
  const hasActiveFilter = searchQuery.trim() !== '' || typeFilter !== 'all';

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="יומן פעילות" subtitle={PAGE_DESC['/yoman-peilut']} />
      <Skeleton />
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="יומן פעילות" subtitle={PAGE_DESC['/yoman-peilut']} />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl py-16 text-center text-destructive">
        שגיאה בטעינת האירועים
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="יומן פעילות"
        description="יומן הפעילות של הרב קלמן מאיר בר, הרב הראשי לישראל — פגישות, ביקורים ואירועים רשמיים."
      />
      <PageHeader title="יומן פעילות" subtitle={PAGE_DESC['/yoman-peilut']} />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl py-8">

        {/* ── Filter bar ── */}
        <div className="bg-white border border-border rounded-xl p-4 mb-8 shadow-sm space-y-3">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="חיפוש לפי כותרת, מיקום או משתתף..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); }}
                className="pr-9 h-11 bg-white border border-input"
                aria-label="חיפוש אירועים"
              />
            </div>
            {hasActiveFilter && (
              <button
                onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
                className="h-11 w-11 flex items-center justify-center rounded-md border border-input bg-white text-muted-foreground hover:text-primary hover:border-primary transition-colors flex-shrink-0"
                aria-label="נקה סינון"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type pills */}
          {allTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
                }`}
              >
                הכל
              </button>
              {allTypes.map(type => {
                const style = getEventTypeStyle(type);
                const active = typeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type === typeFilter ? 'all' : type)}
                    className="px-3 py-1 rounded-full text-sm font-medium border transition-colors"
                    style={active
                      ? { backgroundColor: style.text, color: '#fff', borderColor: style.text }
                      : { backgroundColor: style.bg, color: style.text, borderColor: 'transparent' }
                    }
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Results count ── */}
        <p className="text-sm text-muted-foreground mb-6">
          {hasActiveFilter
            ? `${filtered.length} תוצאות`
            : `${events.length} אירועים`}
        </p>

        {/* ── Month groups ── */}
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">לא נמצאו אירועים</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
              className="text-secondary hover:underline text-sm"
            >
              נקה סינון
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(({ key, label, events: monthEvents }) => (
              <section key={key} aria-label={label}>
                <MonthHeader label={label} count={monthEvents.length} />

                {/* Featured card — first event of month */}
                <FeaturedCard event={monthEvents[0]} />

                {/* Remaining events grid */}
                {monthEvents.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {monthEvents.slice(1).map(event => (
                      <EventCard key={event.linkId} event={event} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
