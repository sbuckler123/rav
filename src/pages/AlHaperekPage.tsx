import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, FileText, Video, Images, FileDown, CalendarDays, ChevronLeft, ChevronRight, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { PAGE_DESC } from '@/config/nav';
import { useAlHaperek } from '@/hooks/useQueries';
import type { AlHaperekItem, ContentBlock } from '@/api/getAlHaperek';

const ITEMS_PER_PAGE = 12;

// ── Content-type helpers ──────────────────────────────────────────────────────

type BlockType = ContentBlock['type'];

const TYPE_CONFIG: Record<BlockType, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bar: string;
  bg: string;
  iconCls: string;
}> = {
  video:  { label: 'וידאו',  Icon: Video,    bar: 'bg-red-500',    bg: 'bg-red-50',    iconCls: 'text-red-500'    },
  pdf:    { label: 'PDF',    Icon: FileDown, bar: 'bg-orange-500', bg: 'bg-orange-50', iconCls: 'text-orange-500' },
  images: { label: 'תמונות', Icon: Images,   bar: 'bg-green-500',  bg: 'bg-green-50',  iconCls: 'text-green-500'  },
  text:   { label: 'טקסט',  Icon: FileText, bar: 'bg-blue-500',   bg: 'bg-blue-50',   iconCls: 'text-blue-500'   },
};

function primaryType(blocks: ContentBlock[]): BlockType | null {
  for (const t of ['video', 'pdf', 'images', 'text'] as BlockType[]) {
    if (blocks.some(b => b.type === t)) return t;
  }
  return null;
}

function ContentTypeBadge({ blocks }: { blocks: ContentBlock[] }) {
  const t = primaryType(blocks);
  if (!t) return null;
  const { label, Icon, bg, iconCls } = TYPE_CONFIG[t];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md ${bg} ${iconCls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function formatDate(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Featured card — large typographic treatment, no box ──────────────────────

function FeaturedCard({ item }: { item: AlHaperekItem }) {
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group mb-8 pb-8 border-b-2 border-border">
      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-6 h-0.5 bg-secondary flex-shrink-0" />
        <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.18em] flex-shrink-0">
          העדכון האחרון
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Type + tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ContentTypeBadge blocks={item.blocks} />
        {item.tags.slice(0, 3).map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>

      {/* Title */}
      <h2 className="font-serif font-bold text-3xl sm:text-4xl leading-tight text-primary group-hover:text-secondary transition-colors duration-200 mb-4">
        {item.title}
      </h2>

      {/* Summary with accent border */}
      {item.summary && (
        <p className="text-base text-foreground/60 leading-relaxed line-clamp-3 border-r-[3px] border-secondary/40 pr-4 mb-5">
          {item.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4">
        {item.date && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(item.date)}
          </span>
        )}
        <span className="text-sm font-semibold text-secondary inline-flex items-center gap-1.5 group-hover:gap-3 transition-all duration-200 mr-auto">
          לקריאה המלאה
          <ArrowLeft className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

// ── Secondary card — items 1–4, two-column grid ───────────────────────────────

function SecondaryCard({ item }: { item: AlHaperekItem }) {
  const t = primaryType(item.blocks);
  const barColor = t ? TYPE_CONFIG[t].bar : 'bg-border';
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group h-full">
      <div className="flex flex-col h-full bg-white rounded-xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className={`h-1 w-full ${barColor}`} />
        <div className="flex flex-col flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <ContentTypeBadge blocks={item.blocks} />
            {item.date && (
              <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(item.date)}</span>
            )}
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.slice(0, 2).map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5">{t}</Badge>
              ))}
            </div>
          )}
          <h3 className="font-serif font-bold text-base sm:text-lg leading-snug text-primary group-hover:text-secondary transition-colors line-clamp-2 flex-1">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
              {item.summary}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── List row — items 5+, compact rows ────────────────────────────────────────

function ListRow({ item }: { item: AlHaperekItem }) {
  const t = primaryType(item.blocks);
  const { bg, iconCls, Icon } = t
    ? TYPE_CONFIG[t]
    : { bg: 'bg-muted', iconCls: 'text-muted-foreground', Icon: FileText };
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group">
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon className={`h-4 w-4 ${iconCls}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-sm sm:text-base text-primary group-hover:text-secondary transition-colors line-clamp-1">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 hidden sm:block">
              {item.summary}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 space-y-0.5 text-left">
          {item.tags.length > 0 && (
            <p className="text-[10px] font-semibold text-secondary uppercase tracking-wide">{item.tags[0]}</p>
          )}
          {item.date && (
            <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  search, setSearch,
  selectedTag, setSelectedTag,
  allTags, items, filtered,
  resetPage,
}: {
  search: string;
  setSearch: (v: string) => void;
  selectedTag: string;
  setSelectedTag: (v: string) => void;
  allTags: string[];
  items: AlHaperekItem[];
  filtered: AlHaperekItem[];
  resetPage: () => void;
}) {
  return (
    <aside className="bg-[#F7F4EE] rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
        <SlidersHorizontal className="h-4 w-4 text-secondary flex-shrink-0" />
        <span className="text-sm font-bold text-primary">חיפוש וסינון</span>
      </div>

      {/* Search */}
      <div className="px-4 py-4 border-b border-border/60">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="חיפוש..."
            className="w-full rounded-xl border border-border bg-white pr-9 pl-8 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            dir="rtl"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); resetPage(); }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="px-4 py-4 border-b border-border/60">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">נושאים</p>
          <div className="space-y-1">
            <button
              onClick={() => { setSelectedTag(''); resetPage(); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-right ${
                !selectedTag
                  ? 'bg-primary text-white'
                  : 'text-foreground hover:bg-white hover:shadow-sm'
              }`}
            >
              <span>הכל</span>
              <span className={`text-xs ${!selectedTag ? 'text-white/60' : 'text-muted-foreground'}`}>
                {items.length}
              </span>
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(selectedTag === tag ? '' : tag); resetPage(); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-right ${
                  selectedTag === tag
                    ? 'bg-primary text-white font-medium'
                    : 'text-foreground hover:bg-white hover:shadow-sm'
                }`}
              >
                <span>{tag}</span>
                <span className={`text-xs ${selectedTag === tag ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {items.filter(i => i.tags.includes(tag)).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result count */}
      <div className="px-5 py-4">
        <p className="text-sm text-muted-foreground">
          נמצאו{' '}
          <span className="font-bold text-primary">{filtered.length}</span>{' '}
          פריטים
        </p>
        {(search || selectedTag) && (
          <button
            onClick={() => { setSearch(''); setSelectedTag(''); resetPage(); }}
            className="mt-2 text-xs text-secondary hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            נקה סינון
          </button>
        )}
      </div>
    </aside>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlHaperekPage() {
  const { data, isLoading } = useAlHaperek();
  const items: AlHaperekItem[] = data?.items ?? [];

  const [search, setSearch]           = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage]               = useState(1);

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
        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-8 lg:items-start">

          {/* Sidebar — top on mobile, left column on desktop (col-start-2 in RTL = left) */}
          <div className="mb-6 lg:mb-0 lg:col-start-2 lg:sticky lg:top-6">
            <Sidebar
              search={search} setSearch={setSearch}
              selectedTag={selectedTag} setSelectedTag={setSelectedTag}
              allTags={allTags} items={items} filtered={filtered}
              resetPage={resetPage}
            />
          </div>

          {/* Main content — right column on desktop */}
          <div className="lg:col-start-1">
            {isLoading ? (
              <div className="space-y-6">
                <div className="space-y-3 pb-8 border-b-2 border-border">
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />)}
                </div>
                <div className="rounded-xl bg-muted animate-pulse h-40" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg mb-2">לא נמצאו פריטים</p>
                {(search || selectedTag) && (
                  <button
                    onClick={() => { setSearch(''); setSelectedTag(''); resetPage(); }}
                    className="text-sm text-secondary hover:underline"
                  >
                    נקה סינון
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Featured */}
                <FeaturedCard item={visible[0]} />

                {/* Secondary grid — items 1–4 */}
                {visible.length > 1 && (
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {visible.slice(1, 5).map(item => (
                      <SecondaryCard key={item.linkId} item={item} />
                    ))}
                  </div>
                )}

                {/* List — items 5+ */}
                {visible.length > 5 && (
                  <div className="bg-white rounded-xl border border-border overflow-hidden mb-8">
                    {visible.slice(5).map(item => (
                      <ListRow key={item.linkId} item={item} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="flex justify-center items-center gap-2 mt-4 flex-wrap" aria-label="ניווט בין דפים">
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
          </div>

        </div>
      </main>
    </div>
  );
}
