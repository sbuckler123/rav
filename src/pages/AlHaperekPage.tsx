import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, FileText, Video, Images, FileDown, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { PAGE_DESC } from '@/config/nav';
import { useAlHaperek } from '@/hooks/useQueries';
import type { AlHaperekItem, ContentBlock } from '@/api/getAlHaperek';

const ITEMS_PER_PAGE = 12;

function blockTypeIcons(blocks: ContentBlock[]) {
  const types = new Set(blocks.map(b => b.type));
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {types.has('video')  && <span title="וידאו"  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5"><Video  className="h-3 w-3" />וידאו</span>}
      {types.has('images') && <span title="תמונות" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5"><Images className="h-3 w-3" />תמונות</span>}
      {types.has('pdf')    && <span title="PDF"    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5"><FileDown className="h-3 w-3" />PDF</span>}
      {types.has('text')   && <span title="טקסט"  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5"><FileText className="h-3 w-3" />טקסט</span>}
    </div>
  );
}

function formatDate(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ItemCard({ item }: { item: AlHaperekItem }) {
  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200 group border border-border">
      {/* Cover image */}
      <div className="w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex-shrink-0">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-10 w-10 text-primary/30" />
          </div>
        )}
      </div>

      <CardContent className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.slice(0, 3).map(t => (
              <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5">{t}</Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <Link to={`/al-haperek/${item.linkId}`}>
          <h2 className="font-serif font-bold text-base sm:text-lg leading-snug text-primary hover:text-secondary transition-colors line-clamp-2 mb-2">
            {item.title}
          </h2>
        </Link>

        {/* Summary */}
        {item.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 mb-3">
            {item.summary}
          </p>
        )}

        {/* Date + block type indicators */}
        <div className="mt-auto">
          {item.date && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <CalendarDays className="h-3 w-3" />
              {formatDate(item.date)}
            </p>
          )}
          {item.blocks.length > 0 && blockTypeIcons(item.blocks)}
        </div>

        <Link to={`/al-haperek/${item.linkId}`} className="mt-4">
          <Button size="sm" variant="outline" className="w-full hover:bg-primary hover:text-white transition-colors">
            לקריאה המלאה
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function AlHaperekPage() {
  const { data, isLoading } = useAlHaperek();
  const items: AlHaperekItem[] = data?.items ?? [];

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);

  const allTags = [...new Set(items.flatMap(i => i.tags))].sort();

  const term = search.trim().toLowerCase();
  const filtered = items.filter(i => {
    const matchesSearch = !term || i.title.toLowerCase().includes(term) || i.summary?.toLowerCase().includes(term);
    const matchesTag = !selectedTag || i.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visible = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
        <div className="mb-8 rounded-2xl border border-border/60 bg-[#F7F4EE] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-secondary rounded-full flex-shrink-0" />
            <span className="text-sm font-semibold text-primary">חיפוש וסינון</span>
          </div>

          {/* Search */}
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

          {/* Tag pills */}
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

          {/* Result count + clear */}
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

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">לא נמצאו פריטים</p>
            {(search || selectedTag) && (
              <button onClick={() => { setSearch(''); setSelectedTag(''); resetPage(); }} className="text-sm text-secondary hover:underline">נקה סינון</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map(item => <ItemCard key={item.linkId} item={item} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex justify-center items-center gap-2 mt-10 flex-wrap" aria-label="ניווט בין דפים">
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
