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

// ── Content-type helpers ──────────────────────────────────────────────────────

type BlockType = ContentBlock['type'];

const TYPE_CONFIG: Record<BlockType, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bar: string;     // top border color
  bg: string;      // icon background
  iconCls: string; // icon color
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

// ── Featured card — item 0, full-width on primary background ─────────────────

function FeaturedCard({ item }: { item: AlHaperekItem }) {
  const t = primaryType(item.blocks);
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group">
      <div className="bg-primary rounded-2xl p-6 sm:p-8 hover:bg-primary/90 transition-colors duration-300">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {t && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide bg-white/15 text-white`}>
              {(() => { const { Icon, label } = TYPE_CONFIG[t]; return <><Icon className="h-3 w-3" />{label}</>; })()}
            </span>
          )}
          {item.tags.slice(0, 3).map(tag => (
            <Badge key={tag} className="bg-secondary text-primary text-[10px] border-0 font-semibold">{tag}</Badge>
          ))}
        </div>

        <h2 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl leading-snug text-white group-hover:text-secondary transition-colors mb-4">
          {item.title}
        </h2>

        {item.summary && (
          <p className="text-white/65 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
            {item.summary}
          </p>
        )}

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/15">
          {item.date && (
            <span className="flex items-center gap-1.5 text-sm text-white/50">
              <CalendarDays className="h-4 w-4" />
              {formatDate(item.date)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary group-hover:gap-3 transition-all duration-200 mr-auto">
            לקריאה המלאה
            <ArrowLeft className="h-4 w-4" />
          </span>
        </div>
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
        {/* Colored top bar by content type */}
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

// ── List row — items 5+, compact horizontal rows ──────────────────────────────

function ListRow({ item }: { item: AlHaperekItem }) {
  const t = primaryType(item.blocks);
  const { bg, iconCls, Icon } = t ? TYPE_CONFIG[t] : { bg: 'bg-muted', iconCls: 'text-muted-foreground', Icon: FileText };
  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group">
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
        {/* Content type icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon className={`h-4 w-4 ${iconCls}`} />
        </div>
        {/* Text */}
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
        {/* Tag + date */}
        <div className="flex-shrink-0 text-left sm:text-right space-y-0.5">
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

        {/* ── Dark filter bar ── */}
        <div className="mb-8 rounded-2xl bg-primary overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage(); }}
                placeholder="חיפוש לפי כותרת או תיאור..."
                className="w-full rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/35 pr-11 pl-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-white/30 transition-all min-h-[48px]"
                dir="rtl"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); resetPage(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/15 text-white/50 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedTag(''); resetPage(); }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px] ${
                  !selectedTag
                    ? 'bg-secondary text-primary'
                    : 'border border-white/25 text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                הכל
                <span className="mr-1 text-xs opacity-70">({items.length})</span>
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => { setSelectedTag(selectedTag === tag ? '' : tag); resetPage(); }}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px] ${
                    selectedTag === tag
                      ? 'bg-secondary text-primary'
                      : 'border border-white/25 text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tag}
                  <span className="mr-1 text-xs opacity-70">({items.filter(i => i.tags.includes(tag)).length})</span>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 sm:px-5 pb-4 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-white/50">
              נמצאו <span className="text-white font-semibold">{filtered.length}</span> פריטים
            </span>
            {(search || selectedTag) && (
              <button
                onClick={() => { setSearch(''); setSelectedTag(''); resetPage(); }}
                className="text-xs text-white/45 hover:text-white/80 flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />נקה סינון
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-56 sm:h-72 rounded-2xl bg-primary/20 animate-pulse" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />)}
            </div>
            <div className="rounded-xl bg-muted animate-pulse h-48" />
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
            <div className="mb-6">
              <FeaturedCard item={visible[0]} />
            </div>

            {/* Secondary grid — items 1–4 */}
            {visible.length > 1 && (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {visible.slice(1, 5).map(item => (
                  <SecondaryCard key={item.linkId} item={item} />
                ))}
              </div>
            )}

            {/* List — items 5+ */}
            {visible.length > 5 && (
              <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
                {visible.slice(5).map(item => (
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
