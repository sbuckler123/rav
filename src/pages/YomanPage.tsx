import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, LayoutGrid, List, X, Users, Plane, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/Breadcrumbs';
import { YOMAN_LIST, EVENT_TYPES, getEventTypeStyle, getEventTypeCounts, getMonthArchive, getYomanBySlug, type YomanListItem } from '@/lib/yoman';

const ITEMS_PER_PAGE = 6;

export default function YomanPage() {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...YOMAN_LIST];
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
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page]);

  const clearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const eventTypeCounts = useMemo(() => getEventTypeCounts(), []);
  const monthArchive = useMemo(() => getMonthArchive(), []);
  const placeholderImg = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80" fill="%23E5E7EB"><rect width="120" height="80" fill="%23E5E7EB"/><path d="M60 32c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="%236B7280"/><path d="M76 56H44c-2.2 0-4-1.8-4-4v-2l8-8 6 6 10-12 14 20v0c0 2.2-1.8 4-4 4z" fill="%236B7280"/></svg>');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <Breadcrumbs items={[
        { label: 'דף הבית', href: '/' },
        { label: 'יומן רבנות' }]
        } />

        {/* כותרת הדף */}
        <header className="text-center py-8">
          <h1 className='text-4xl md:text-5xl font-serif font-bold text-primary mb-2'>יומן הרבנות</h1>
          <p className="text-muted-foreground font-sans text-base mb-6">
            תיעוד וסיכום של פגישות, ביקורי רבנים ואירועים ציבוריים במחיצת הרב הראשי
          </p>
          <div className="w-20 h-1 rounded-full bg-secondary mx-auto" style={{ height: '4px' }} aria-hidden />
        </header>

        {/* סרגל חיפוש */}
        <div className="bg-[#FAF8F2] border border-border rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="חפש פגישה, אירוע או שם משתתף..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pr-12 pl-12 bg-white border-border h-12 text-base shadow-sm focus:shadow-md transition-shadow" />

              {searchQuery &&
              <button
                type="button"
                onClick={clearSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="נקה חיפוש">

                  <X className="h-5 w-5" />
                </button>
              }
            </div>
          </div>
        </div>

        {/* מונה תוצאות + מעבר תצוגה */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-border">
          <p className="text-muted-foreground font-sans">
            נמצאו{' '}
            <span className="font-bold text-foreground">{filtered.length}</span>{' '}
            רשומות ביומן הרבנות
          </p>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('timeline')}
              className={viewMode === 'timeline' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : ''}
              aria-label="תצוגת טיימליין">

              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : ''}
              aria-label="תצוגת רשת">

              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 py-8">
          {/* תוכן ראשי */}
          <div>
            {viewMode === 'timeline' ?
            <TimelineView items={pageItems} placeholderImg={placeholderImg} /> :

            <GridView items={pageItems} placeholderImg={placeholderImg} />
            }

            {/* Pagination */}
            {totalPages > 1 &&
            <nav className="flex justify-center gap-2 mt-10" aria-label="ניווט בין דפים">
                <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>

                  הקודם
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
              <Button
                key={n}
                variant={n === page ? 'default' : 'outline'}
                size="sm"
                className={n === page ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : ''}
                onClick={() => setPage(n)}>

                    {n}
                  </Button>
              )}
                <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>

                  הבא
                </Button>
              </nav>
            }
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* במספרים */}
            <div className="rounded-lg p-6 bg-[#FAF8F2] border border-border">
              <h3 className="font-serif font-bold text-lg text-primary mb-3 pb-2 border-b-2 border-secondary w-fit">
                במספרים
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="block text-2xl font-serif font-bold text-secondary">
                      {YOMAN_LIST.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      רשומות ביומן
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Plane className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="block text-2xl font-serif font-bold text-secondary">
                      {YOMAN_LIST.filter((e) => e.eventType === 'ביקור קהילות' || e.eventType === 'סיור').length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ביקורים וסיורים
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Mic className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="block text-2xl font-serif font-bold text-secondary">
                      {YOMAN_LIST.filter((e) => e.eventType === 'כנס' || e.eventType === 'אירוע ציבורי').length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      כנסים ואירועים
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* לפי סוג */}
            <div className="rounded-lg p-6 border border-border bg-card">
              <h3 className="font-serif font-bold text-lg text-primary mb-3 pb-2 border-b-2 border-secondary w-fit">
                לפי סוג
              </h3>
              <ul className="space-y-2">
                {EVENT_TYPES.map((t) => {
                  const style = getEventTypeStyle(t);
                  const count = eventTypeCounts[t] ?? 0;
                  if (count === 0) return null;
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(t);
                          setPage(1);
                        }}
                        className="w-full text-right flex items-center justify-between gap-2 py-1.5 rounded hover:bg-accent transition-colors group">

                        <span
                          className="rounded px-2 py-0.5 text-xs font-medium shrink-0"
                          style={{ backgroundColor: style.bg, color: style.text }}>

                          {t}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({count})
                        </span>
                      </button>
                    </li>);

                })}
              </ul>
            </div>

            {/* ארכיון חודשי */}
            <div className="rounded-lg p-6 border border-border bg-card">
              <h3 className="font-serif font-bold text-lg text-primary mb-3 pb-2 border-b-2 border-secondary w-fit">
                ארכיון חודשי
              </h3>
              <ul className="space-y-2">
                {monthArchive.slice(0, 8).map((item) =>
                <li key={`${item.month}-${item.year}`}>
                    <Link
                    to="/yoman"
                    onClick={(e) => {
                      e.preventDefault();
                      setSearchQuery(`${item.month} ${item.year}`);
                      setPage(1);
                    }}
                    className="block py-1.5 text-sm hover:text-secondary transition-colors">

                      {item.month} {item.year} ({item.count})
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>);

}

function TimelineView({ items, placeholderImg }: {items: YomanListItem[];placeholderImg: string;}) {
  return (
    <div className="space-y-8">
      {items.map((entry) => {
        const style = getEventTypeStyle(entry.eventType);
        const fullEntry = getYomanBySlug(entry.slug);
        const imageUrl = fullEntry?.gallery?.[0]?.url || placeholderImg;
        return (
          <div key={entry.id} className="flex gap-6">
            <div className="flex-1 min-w-0 rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md hover:bg-[#F5F0E8] transition-all duration-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="shrink-0 float-right md:float-none md:order-1">
                  <img src={imageUrl} alt={entry.title} className="h-20 w-30 rounded-md object-cover md:h-20 md:w-[120px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    {entry.dateHebrew} · {entry.dateLocale}
                  </p>
                  <span
                    className="inline-block rounded px-2 py-0.5 text-xs font-medium mb-2"
                    style={{ backgroundColor: style.bg, color: style.text }}>

                    {entry.eventType}
                  </span>
                  <Link to={`/yoman/${entry.slug}`}>
                    <h2 className="text-xl font-serif font-bold text-primary mb-2 hover:text-secondary transition-colors">
                      {entry.title}
                    </h2>
                  </Link>
                  <p className="text-foreground text-sm leading-relaxed line-clamp-3 mb-3">
                    {entry.excerpt}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {entry.location}
                  </p>
                  



                  <Link to={`/yoman/${entry.slug}`} className="inline-block mt-4">
                    <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      לקריאה המלאה →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>);

      })}
    </div>);

}

function GridView({ items, placeholderImg }: {items: YomanListItem[];placeholderImg: string;}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((entry) => {
        const style = getEventTypeStyle(entry.eventType);
        const fullEntry = getYomanBySlug(entry.slug);
        const imageUrl = fullEntry?.gallery?.[0]?.url || placeholderImg;
        return (
          <article key={entry.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:bg-[#F5F0E8] transition-all duration-200">
            <div className="aspect-video overflow-hidden">
              <img src={imageUrl} alt={entry.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <span
                className="inline-block rounded px-2 py-0.5 text-xs font-medium mb-2"
                style={{ backgroundColor: style.bg, color: style.text }}>

                {entry.eventType}
              </span>
              <Link to={`/yoman/${entry.slug}`}>
                <h2 className="font-serif font-bold text-primary text-lg mb-1 hover:text-secondary transition-colors line-clamp-2">
                  {entry.title}
                </h2>
              </Link>
              <p className="text-sm text-muted-foreground mb-1">
                {entry.dateHebrew}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5" />
                {entry.location}
              </p>
              <p className="text-sm text-foreground line-clamp-2 mb-3">
                {entry.excerpt}
              </p>
              <Link to={`/yoman/${entry.slug}`}>
                <Button size="sm" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  לקריאה המלאה →
                </Button>
              </Link>
            </div>
          </article>);

      })}
    </div>);

}