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
import { cldOptimize } from '@/lib/cloudinaryImage';

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
  video:  { label: 'וידאו',  Icon: Video,    bar: 'bg-secondary',      bg: 'bg-secondary/10', iconCls: 'text-secondary-foreground' },
  pdf:    { label: 'PDF',    Icon: FileDown, bar: 'bg-primary',        bg: 'bg-primary/10',   iconCls: 'text-primary'              },
  images: { label: 'תמונות', Icon: Images,   bar: 'bg-secondary/70',   bg: 'bg-secondary/10', iconCls: 'text-secondary-foreground' },
  text:   { label: 'טקסט',  Icon: FileText, bar: 'bg-primary/60',     bg: 'bg-primary/10',   iconCls: 'text-primary'              },
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

function formatDayMonth(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
}

// ── Date grouping ─────────────────────────────────────────────────────────────

function dateValue(raw?: string): number {
  if (!raw) return -Infinity;
  const t = new Date(raw).getTime();
  return isNaN(t) ? -Infinity : t;
}

function monthKey(raw?: string): string {
  if (!raw) return 'no-date';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'no-date';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(raw?: string): string {
  if (!raw) return 'ללא תאריך';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'ללא תאריך';
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

/** Groups a date-sorted list into contiguous month buckets. */
function groupByMonth(items: AlHaperekItem[]) {
  const groups: { key: string; label: string; items: AlHaperekItem[] }[] = [];
  let current: { key: string; label: string; items: AlHaperekItem[] } | null = null;
  for (const item of items) {
    const key = monthKey(item.date);
    if (!current || current.key !== key) {
      current = { key, label: monthLabel(item.date), items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

// ── Featured card — large typographic treatment, no box ──────────────────────

function FeaturedCard({ item }: { item: AlHaperekItem }) {
  return (
    <Link to={`/idkunim/${item.linkId}`} className="block group mb-8 pb-8 border-b-2 border-border">
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
      <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight text-primary group-hover:text-secondary transition-colors duration-200 mb-4">
        {item.title}
      </h2>

      {/* Summary with accent border */}
      {item.summary && (
        <p className="text-base text-foreground/60 leading-relaxed line-clamp-3 border-r-[3px] border-secondary/40 pr-4 mb-5">
          {item.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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

// ── Month section header ──────────────────────────────────────────────────────

function MonthHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
      <h3 className="text-sm font-bold text-primary flex-shrink-0">{label}</h3>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ── Editorial row — newspaper-style entry ────────────────────────────────────

function EditorialRow({ item }: { item: AlHaperekItem }) {
  const t = primaryType(item.blocks);
  const { bg, iconCls, Icon, label } = t
    ? TYPE_CONFIG[t]
    : { bg: 'bg-muted', iconCls: 'text-muted-foreground', Icon: FileText, label: '' };

  return (
    <Link to={`/idkunim/${item.linkId}`} className="block group">
      <article className="flex gap-3 sm:gap-4 py-5 border-b border-border last:border-0">
        {/* Type icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon className={`h-5 w-5 ${iconCls}`} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {label && <span className={`text-[11px] font-semibold ${iconCls}`}>{label}</span>}
            {label && item.date && <span className="text-muted-foreground/40">·</span>}
            {item.date && (
              <time className="text-xs text-muted-foreground">{formatDayMonth(item.date)}</time>
            )}
          </div>
          <h3 className="font-serif font-bold text-lg sm:text-xl leading-snug text-primary group-hover:text-secondary transition-colors line-clamp-2">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 mt-1 leading-relaxed">
              {item.summary}
            </p>
          )}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[11px] font-medium text-secondary">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Optional thumbnail — only when the item has a cover image */}
        {item.coverImage && (
          <div className="hidden sm:block w-28 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <img src={cldOptimize(item.coverImage, 320, 240)} alt="" loading="lazy" className="w-full h-full object-cover" />
          </div>
        )}
      </article>
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
  const [tagsOpen, setTagsOpen] = useState(false);

  return (
    <aside className="bg-[#F7F4EE] rounded-2xl border border-border overflow-hidden">
      {/* Header — desktop only */}
      <div className="hidden lg:flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
        <SlidersHorizontal className="h-4 w-4 text-secondary flex-shrink-0" />
        <span className="text-sm font-bold text-primary">חיפוש וסינון</span>
      </div>

      {/* Search row — mobile has inline filter toggle */}
      <div className="px-4 py-3 lg:py-4 border-b border-border/60">
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          {/* Filter toggle — mobile only */}
          <button
            onClick={() => setTagsOpen(o => !o)}
            className={`lg:hidden flex-shrink-0 h-10 px-3 rounded-xl border bg-white flex items-center gap-1.5 text-sm font-medium transition-colors ${
              selectedTag || tagsOpen ? 'border-secondary text-secondary' : 'border-border text-muted-foreground'
            }`}
            aria-label="פתח סינון"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {selectedTag && <span className="h-1.5 w-1.5 rounded-full bg-secondary" />}
          </button>
        </div>
      </div>

      {/* Tag filter — always on desktop, collapsible on mobile */}
      {allTags.length > 0 && (
        <div className={`px-4 py-4 border-b border-border/60 ${tagsOpen ? '' : 'hidden lg:block'}`}>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">נושאים</p>
          <div className="space-y-1">
            <button
              onClick={() => { setSelectedTag(''); resetPage(); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-right ${
                !selectedTag ? 'bg-primary text-white' : 'text-foreground hover:bg-white hover:shadow-sm'
              }`}
            >
              <span>הכל</span>
              <span className={`text-xs ${!selectedTag ? 'text-white/60' : 'text-muted-foreground'}`}>{items.length}</span>
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(selectedTag === tag ? '' : tag); resetPage(); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-right ${
                  selectedTag === tag ? 'bg-primary text-white font-medium' : 'text-foreground hover:bg-white hover:shadow-sm'
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

      {/* Result count — always on desktop, collapsible on mobile */}
      <div className={`px-5 py-4 ${tagsOpen ? '' : 'hidden lg:block'}`}>
        <p className="text-sm text-muted-foreground">
          נמצאו <span className="font-bold text-primary">{filtered.length}</span> פריטים
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
  const filtered = items
    .filter(i => {
      const matchesSearch = !term || i.title.toLowerCase().includes(term) || i.summary?.toLowerCase().includes(term);
      const matchesTag    = !selectedTag || i.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => dateValue(b.date) - dateValue(a.date));

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visible    = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const groups     = groupByMonth(visible.slice(1));

  function resetPage() { setPage(1); }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="עדכונים"
        description="עדכונים אקטואליים, מכתבים לציבור, ופסקי השעה מאת הרב קלמן מאיר בר."
      />
      <PageHeader title="עדכונים" subtitle={PAGE_DESC['/idkunim']} />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-8 lg:items-start">

          {/* Sidebar — top on mobile, left column on desktop */}
          <div className="mb-6 lg:mb-0 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
            <Sidebar
              search={search} setSearch={setSearch}
              selectedTag={selectedTag} setSelectedTag={setSelectedTag}
              allTags={allTags} items={items} filtered={filtered}
              resetPage={resetPage}
            />
          </div>

          {/* Main content — right column on desktop */}
          <div className="lg:col-start-1 lg:row-start-1">
            {isLoading ? (
              <div className="space-y-8">
                <div className="space-y-3 pb-8 border-b-2 border-border">
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
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
                {/* Featured lead */}
                <FeaturedCard item={visible[0]} />

                {/* Date-grouped editorial feed */}
                {groups.map(group => (
                  <section key={group.key} className="mb-8">
                    <MonthHeader label={group.label} />
                    <div>
                      {group.items.map(item => (
                        <EditorialRow key={item.linkId} item={item} />
                      ))}
                    </div>
                  </section>
                ))}

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
