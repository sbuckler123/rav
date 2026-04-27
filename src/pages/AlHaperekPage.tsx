import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, FileText, Video, Images, FileDown, CalendarDays, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { PAGE_DESC } from '@/config/nav';
import { useAlHaperek } from '@/hooks/useQueries';
import type { AlHaperekItem, ContentBlock } from '@/api/getAlHaperek';

const ITEMS_PER_PAGE = 12;

function blockTypePills(blocks: ContentBlock[]) {
  const types = new Set(blocks.map(b => b.type));
  return (
    <div className="flex items-center gap-1.5">
      {types.has('video')  && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5"><Video  className="h-3 w-3" />וידאו</span>}
      {types.has('images') && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5"><Images className="h-3 w-3" />תמונות</span>}
      {types.has('pdf')    && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5"><FileDown className="h-3 w-3" />PDF</span>}
      {types.has('text')   && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5"><FileText className="h-3 w-3" />טקסט</span>}
    </div>
  );
}

function formatDate(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Hero card — first item, full-width editorial ──────────────────────────────

function HeroCard({ item }: { item: AlHaperekItem }) {
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group">
      <div className="flex flex-col-reverse md:flex-row overflow-hidden rounded-2xl border border-border bg-white hover:shadow-xl transition-all duration-300">
        {/* Text */}
        <div className="flex flex-col p-6 sm:p-8 md:flex-1">
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.slice(0, 3).map(t => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
          <h2 className="font-serif font-bold text-2xl sm:text-3xl leading-snug text-primary group-hover:text-secondary transition-colors mb-3">
            {item.title}
          </h2>
          {item.summary && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-4">
              {item.summary}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-auto">
            {item.date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDate(item.date)}
              </span>
            )}
            {item.blocks.length > 0 && blockTypePills(item.blocks)}
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary group-hover:gap-3 transition-all duration-200">
            לקריאה המלאה
            <ArrowLeft className="h-4 w-4" />
          </span>
        </div>
        {/* Image */}
        <div className="aspect-[16/9] md:aspect-auto md:w-[55%] flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center min-h-[200px]">
              <FileText className="h-20 w-20 text-primary/10" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Secondary card — items 1–3, medium grid ───────────────────────────────────

function SecondaryCard({ item }: { item: AlHaperekItem }) {
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group h-full">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
        <div className="aspect-[4/3] overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/10">
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary/20" />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          {item.tags.length > 0 && (
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-wide mb-1.5">
              {item.tags[0]}
            </span>
          )}
          <h3 className="font-serif font-bold text-sm sm:text-base leading-snug text-primary group-hover:text-secondary transition-colors line-clamp-2 flex-1">
            {item.title}
          </h3>
          {item.date && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <CalendarDays className="h-3 w-3" />
              {formatDate(item.date)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── List row — items 4+, compact horizontal ───────────────────────────────────

function ListRow({ item }: { item: AlHaperekItem }) {
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group">
      <div className="flex items-center gap-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 -mx-5 px-5 transition-colors rounded-lg">
        {/* Thumbnail — visually on the left in RTL */}
        <div className="w-20 h-14 sm:w-24 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 order-last">
          {item.coverImage ? (
            <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary/20" />
            </div>
          )}
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          {item.tags.length > 0 && (
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-wide">
              {item.tags[0]}
            </span>
          )}
          <h3 className="font-serif font-bold text-sm sm:text-base leading-snug text-primary group-hover:text-secondary transition-colors line-clamp-1 mt-0.5">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 hidden sm:block">
              {item.summary}
            </p>
          )}
          {item.date && (
            <p className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlHaperekPage() {
  const { data, isLoading } = useAlHaperek();
  const items: AlHaperekItem[] = data?.items ?? [];

  const [search, setSearch]       = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage]           = useState(1);

  const allTags = [...new Set(items.flatMap(i => i.tags))].sort();

  const term = search.trim().toLowerCase();
  const filtered = items.filter(i => {
    const matchesSearch = !term || i.title.toLowerCase().includes(term) || i.summary?.toLowerCase().includes(term);
    const matchesTag    = !selectedTag || i.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visible    = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function resetPage() { setPage(1); }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="על הפרק"
        description="עדכונים אקטואליים, מכתבים לציבור, ופסקי השעה מאת הרב קלמן מאיר בר."
      />
      <PageHeader title="על הפרק" subtitle={PAGE_DESC['/al-haperek']} />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">

        {/* Filter bar */}
        <div className="mb-8 rounded-2xl border border-border/60 bg-[#F7F4EE] p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-secondary rounded-full flex-shrink-0" />
            <span className="text-sm font-semibold text-primary">חיפוש וסינון</span>
          </div>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              placeholder="חיפוש לפי כותרת או תיאור..."
              className="w-full rounded-xl border border-border/60 bg-white pr-11 pl-10 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors min-h-[48px]"
              dir="rtl"
            />
            {search && (
              <button onClick={() => { setSearch(''); resetPage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedTag(''); resetPage(); }}
                className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all min-h-[40px] ${!selectedTag ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-input hover:border-primary/40 hover:text-primary'}`}
              >
                הכל <span className={`mr-1 text-xs ${!selectedTag ? 'text-secondary' : 'text-muted-foreground'}`}>({items.length})</span>
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => { setSelectedTag(selectedTag === tag ? '' : tag); resetPage(); }}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all min-h-[40px] ${selectedTag === tag ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-input hover:border-primary/40 hover:text-primary'}`}
                >
                  {tag}
                  <span className={`mr-1 text-xs ${selectedTag === tag ? 'text-secondary' : 'text-muted-foreground'}`}>
                    ({items.filter(i => i.tags.includes(tag)).length})
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
            <span className="text-sm text-muted-foreground">
              נמצאו <span className="font-bold text-primary">{filtered.length}</span> פריטים
            </span>
            {(search || selectedTag) && (
              <button onClick={() => { setSearch(''); setSelectedTag(''); resetPage(); }} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                <X className="h-3 w-3" />נקה סינון
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-64 sm:h-80 rounded-2xl bg-muted animate-pulse" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
              ))}
            </div>
            <div className="rounded-xl bg-muted animate-pulse h-40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">לא נמצאו פריטים</p>
            {(search || selectedTag) && (
              <button onClick={() => { setSearch(''); setSelectedTag(''); resetPage(); }} className="text-sm text-secondary hover:underline">
                נקה סינון
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Hero — first item */}
            <div className="mb-6 sm:mb-8">
              <HeroCard item={visible[0]} />
            </div>

            {/* Secondary grid — items 1–3 */}
            {visible.length > 1 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
                {visible.slice(1, 4).map(item => (
                  <SecondaryCard key={item.linkId} item={item} />
                ))}
              </div>
            )}

            {/* Compact list — items 4+ */}
            {visible.length > 4 && (
              <div className="bg-white rounded-xl border border-border px-5 py-2 mb-6 sm:mb-8">
                {visible.slice(4).map(item => (
                  <ListRow key={item.linkId} item={item} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex justify-center items-center gap-2 mt-6 flex-wrap" aria-label="ניווט בין דפים">
                <Button variant="outline" size="icon" className="rounded-full min-h-[44px] min-w-[44px]" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="דף קודם">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | '...')[]>((acc, n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === '...' ? (
                      <span key={`e${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                    ) : (
                      <Button key={n} variant={n === page ? 'default' : 'outline'} onClick={() => setPage(n as number)}
                        className={`rounded-full min-h-[44px] min-w-[44px] w-11 h-11 ${n === page ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : ''}`}
                        aria-label={`דף ${n}`} aria-current={n === page ? 'page' : undefined}>
                        {n}
                      </Button>
                    )
                  )}
                <Button variant="outline" size="icon" className="rounded-full min-h-[44px] min-w-[44px]" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="דף הבא">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
