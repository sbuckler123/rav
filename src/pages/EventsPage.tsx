import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, LayoutGrid, List, X, Users, Plane, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { PAGE_DESC } from '@/config/nav';
import { getEvents, type EventItem } from '@/api/getEvents';
import { getEventTypeStyle } from '@/lib/yoman';

const ITEMS_PER_PAGE = 6;
const EVENT_TYPES_LIST = ['פגישה', 'ביקור קהילות', 'סיור', 'כנס', 'אירוע ציבורי', 'טקס', 'השתלמות'];

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvents()
      .then(({ events }) => setEvents(events))
      .catch((err) => { console.error('getEvents error:', err); setError('שגיאה בטעינת האירועים'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...events];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.excerpt.toLowerCase().includes(q) ||
        e.participantsShort.some((p) => p.toLowerCase().includes(q)) ||
        e.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, events]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page]);

  const clearSearch = () => { setSearchQuery(''); setPage(1); };

  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => { counts[e.eventType] = (counts[e.eventType] ?? 0) + 1; });
    return counts;
  }, [events]);

  const monthArchive = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((e) => {
      if (!e.dateLocale) return;
      const d = new Date(e.dateLocale);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, count]) => {
        const [year, month] = key.split('-');
        const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString('he-IL', { month: 'long' });
        return { month: monthName, year, count };
      });
  }, [events]);

  const placeholderImg = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80" fill="%23E5E7EB"><rect width="120" height="80" fill="%23E5E7EB"/><path d="M60 32c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="%236B7280"/><path d="M76 56H44c-2.2 0-4-1.8-4-4v-2l8-8 6 6 10-12 14 20v0c0 2.2-1.8 4-4 4z" fill="%236B7280"/></svg>');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="יומן פעילות" subtitle={PAGE_DESC['/yoman-peilut']} />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-16 text-center text-muted-foreground">טוען אירועים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="יומן פעילות" subtitle={PAGE_DESC['/yoman-peilut']} />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-16 text-center text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="יומן פעילות"
        description="יומן הפעילות של הרב קלמן מאיר בר, הרב הראשי לישראל — פגישות, ביקורים ואירועים רשמיים."
      />

      {/* Page header — title + subtitle only, no search bar inside */}
      <PageHeader
        title="יומן פעילות"
        subtitle={PAGE_DESC['/yoman-peilut']}
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">

        {/* Warm search bar card — original design */}
        <div className="bg-[#FAF8F2] border border-border rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="חפש פגישה, אירוע או שם משתתף..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pr-12 pl-12 bg-white border-border h-12 text-base shadow-sm focus:shadow-md transition-shadow"
                aria-label="חיפוש אירועים"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="נקה חיפוש"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results count + view toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-border">
          <p className="text-muted-foreground font-sans">
            נמצאו{' '}
            <span className="font-bold text-foreground">{filtered.length}</span>{' '}
            רשומות באירועים
          </p>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('timeline')}
              className={viewMode === 'timeline' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : ''}
              aria-label="תצוגת טיימליין"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : ''}
              aria-label="תצוגת רשת"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 py-8">
          {/* Main content */}
          <div>
            {pageItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg mb-2">לא נמצאו אירועים</p>
                <button type="button" onClick={clearSearch} className="text-secondary hover:underline text-sm">נקה חיפוש</button>
              </div>
            ) : viewMode === 'timeline'
              ? <TimelineView items={pageItems} placeholderImg={placeholderImg} />
              : <GridView items={pageItems} placeholderImg={placeholderImg} />
            }

            {totalPages > 1 && (
              <nav className="flex justify-center gap-2 mt-10" aria-label="ניווט בין דפים">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  הקודם
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    variant={n === page ? 'default' : 'outline'}
                    size="sm"
                    className={n === page ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : ''}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  הבא
                </Button>
              </nav>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* במספרים — warm background restored */}
            <div className="rounded-lg p-6 bg-[#FAF8F2] border border-border">
              <h3 className="font-serif font-bold text-lg text-primary mb-3 pb-2 border-b-2 border-secondary w-fit">
                במספרים
              </h3>
              <div className="space-y-4">
                {[
                  { icon: <Users className="h-5 w-5" />, value: events.length, label: 'רשומות ביומן' },
                  { icon: <Plane className="h-5 w-5" />, value: events.filter((e) => e.eventType === 'ביקור קהילות' || e.eventType === 'סיור').length, label: 'ביקורים וסיורים' },
                  { icon: <Mic className="h-5 w-5" />, value: events.filter((e) => e.eventType === 'כנס' || e.eventType === 'אירוע ציבורי').length, label: 'כנסים ואירועים' },
                ].map(({ icon, value, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">{icon}</span>
                    <div>
                      <span className="block text-2xl font-serif font-bold text-secondary">{value}</span>
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* לפי סוג */}
            <div className="rounded-lg p-6 border border-border bg-card">
              <h3 className="font-serif font-bold text-lg text-primary mb-3 pb-2 border-b-2 border-secondary w-fit">
                לפי סוג
              </h3>
              <ul className="space-y-2">
                {EVENT_TYPES_LIST.map((t) => {
                  const style = getEventTypeStyle(t);
                  const count = eventTypeCounts[t] ?? 0;
                  if (count === 0) return null;
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(t); setPage(1); }}
                        className="w-full text-right flex items-center justify-between gap-2 py-1.5 rounded hover:bg-accent transition-colors group"
                      >
                        <span
                          className="rounded px-2 py-0.5 text-xs font-medium shrink-0"
                          style={{ backgroundColor: style.bg, color: style.text }}
                        >
                          {t}
                        </span>
                        <span className="text-muted-foreground text-sm">({count})</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ארכיון חודשי */}
            <div className="rounded-lg p-6 border border-border bg-card">
              <h3 className="font-serif font-bold text-lg text-primary mb-3 pb-2 border-b-2 border-secondary w-fit">
                ארכיון חודשי
              </h3>
              <ul className="space-y-2">
                {monthArchive.slice(0, 8).map((item) => (
                  <li key={`${item.month}-${item.year}`}>
                    <Link
                      to="/yoman"
                      onClick={(e) => { e.preventDefault(); setSearchQuery(`${item.month} ${item.year}`); setPage(1); }}
                      className="block py-1.5 text-sm hover:text-secondary transition-colors"
                    >
                      {item.month} {item.year} ({item.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      
    </div>
  );
}

function TimelineView({ items, placeholderImg }: { items: EventItem[]; placeholderImg: string }) {
  return (
    <div className="space-y-6">
      {items.map((entry) => {
        const style = getEventTypeStyle(entry.eventType);
        const imageUrl = entry.mainImageUrl || placeholderImg;
        return (
          <div key={entry.id} className="rounded-lg border border-border bg-card shadow-sm hover:shadow-md hover:bg-[#F5F0E8] transition-all duration-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="sm:w-[180px] shrink-0">
                <img
                  src={imageUrl}
                  alt={entry.title}
                  className="w-full h-48 sm:h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 p-5">
                <p className="text-sm text-muted-foreground mb-1">
                  {entry.dateHebrew} · {entry.dateLocale}
                </p>
                <span
                  className="inline-block rounded px-2 py-0.5 text-xs font-medium mb-2"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {entry.eventType}
                </span>
                <Link to={`/events/${entry.linkId}`}>
                  <h2 className="text-xl font-serif font-bold text-primary mb-2 hover:text-secondary transition-colors">
                    {entry.title}
                  </h2>
                </Link>
                <p className="text-foreground text-sm leading-relaxed line-clamp-3 mb-3">
                  {entry.excerpt}
                </p>
                {entry.location && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {entry.location}
                  </p>
                )}
                <Link to={`/events/${entry.linkId}`} className="hidden sm:inline-block">
                  <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    לקריאה המלאה →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GridView({ items, placeholderImg }: { items: EventItem[]; placeholderImg: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((entry) => {
        const style = getEventTypeStyle(entry.eventType);
        const imageUrl = entry.mainImageUrl || placeholderImg;
        return (
          <article key={entry.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:bg-[#F5F0E8] transition-all duration-200">
            <div className="aspect-video overflow-hidden">
              <img src={imageUrl} alt={entry.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <span
                className="inline-block rounded px-2 py-0.5 text-xs font-medium mb-2"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {entry.eventType}
              </span>
              <Link to={`/events/${entry.linkId}`}>
                <h2 className="font-serif font-bold text-primary text-lg mb-1 hover:text-secondary transition-colors line-clamp-2">
                  {entry.title}
                </h2>
              </Link>
              <p className="text-sm text-muted-foreground mb-1">{entry.dateHebrew}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5" />
                {entry.location}
              </p>
              <p className="text-sm text-foreground line-clamp-2 mb-3">{entry.excerpt}</p>
              <Link to={`/events/${entry.linkId}`}>
                <Button size="sm" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  לקריאה המלאה →
                </Button>
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
