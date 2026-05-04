import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Search, X, ChevronLeft, ChevronRight, CalendarDays, Clock, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { PAGE_DESC } from '@/config/nav';
import { type ShiurItem } from '@/api/getVideos';
import { useVideos } from '@/hooks/useQueries';

function getThumb(video: ShiurItem): string {
  if (video.thumbnail) return video.thumbnail;
  if (video.youtubeId) return `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
  return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%231B2A4A"/><polygon points="130,60 130,120 190,90" fill="%23C9A84C"/></svg>');
}

const ITEMS_PER_PAGE = 12;

export default function VideosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const { data, isLoading: loading, isError } = useVideos();
  const videos: ShiurItem[] = data?.shiurim ?? [];
  const gridRef = useRef<HTMLDivElement>(null);

  const clearFilters = () => {
    setSearchQuery(''); setCategoryFilter('all'); setYearFilter('all'); setSortBy('date-desc'); setPage(1);
  };

  const goToPage = (n: number) => {
    setPage(n);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const allCategories = useMemo(
    () => [...new Set(videos.map((v) => v.category).filter(Boolean))],
    [videos],
  );
  const allYears = useMemo(
    () => [...new Set(videos.map((v) => v.dateRaw ? new Date(v.dateRaw).getFullYear().toString() : '').filter(Boolean))].sort((a, b) => Number(b) - Number(a)),
    [videos],
  );

  const filtered = useMemo(() => {
    let list = [...videos];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') list = list.filter((v) => v.category === categoryFilter);
    if (yearFilter !== 'all') list = list.filter((v) => v.dateRaw && new Date(v.dateRaw).getFullYear().toString() === yearFilter);
    if (sortBy === 'date-asc') list.sort((a, b) => a.dateRaw.localeCompare(b.dateRaw));
    else if (sortBy === 'views') list.sort((a, b) => b.views - a.views);
    return list;
  }, [videos, searchQuery, categoryFilter, yearFilter, sortBy]);

  const hasActiveFilter = searchQuery.trim() !== '' || categoryFilter !== 'all' || yearFilter !== 'all';
  const featuredVideo = !hasActiveFilter ? (videos.find((v) => v.isNew) ?? videos[0]) : null;
  const gridVideos = featuredVideo ? filtered.filter((v) => v.linkId !== featuredVideo.linkId) : filtered;
  const totalPages = Math.max(1, Math.ceil(gridVideos.length / ITEMS_PER_PAGE));
  const pageVideos = gridVideos.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="שיעורי תורה" subtitle={PAGE_DESC['/shiurei-torah']} />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl py-8 space-y-6">
        <div className="h-28 bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden bg-white">
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
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="שיעורי תורה" subtitle={PAGE_DESC['/shiurei-torah']} />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl py-16 text-center text-destructive">
        שגיאה בטעינת השיעורים
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="שיעורי תורה"
        description="צפו בשיעורי התורה של הרב קלמן מאיר בר — שיעורי תורה, הלכה ומחשבה מהרב הראשי לישראל."
      />
      <PageHeader title="שיעורי תורה" subtitle={PAGE_DESC['/shiurei-torah']} />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl py-8">

        {/* ── Filter bar ── */}
        <div className="bg-white border border-border rounded-xl p-4 mb-6 shadow-sm space-y-3">
          {/* Search + Sort + Year */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="חיפוש שיעור..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pr-9 h-11 bg-white border border-input"
                aria-label="חיפוש שיעור"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(1); }}>
                <SelectTrigger className="h-11 bg-white border border-input w-[110px]" aria-label="שנה">
                  <SelectValue>{yearFilter === 'all' ? 'כל השנים' : yearFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">כל השנים</SelectItem>
                  {allYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 bg-white border border-input w-[120px]" aria-label="מיון">
                  <SelectValue>
                    {sortBy === 'date-desc' ? 'חדש לישן' : sortBy === 'date-asc' ? 'ישן לחדש' : 'הכי נצפה'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="date-desc">חדש לישן</SelectItem>
                  <SelectItem value="date-asc">ישן לחדש</SelectItem>
                  <SelectItem value="views">הכי נצפה</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="h-11 w-11 flex items-center justify-center rounded-md border border-input bg-white text-muted-foreground hover:text-primary hover:border-primary transition-colors flex-shrink-0"
                  aria-label="נקה סינון"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category pills */}
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setCategoryFilter('all'); setPage(1); }}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
                }`}
              >
                הכל
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat === categoryFilter ? 'all' : cat); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    categoryFilter === cat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Featured video ── */}
        {featuredVideo && (
          <Link
            to={`/shiurei-torah/${featuredVideo.linkId}`}
            aria-label={`צפה בשיעור: ${featuredVideo.title}`}
            className="block mb-8"
          >
            <div className="rounded-xl overflow-hidden border border-border bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Thumbnail */}
                <div className="relative h-56 sm:h-64 lg:h-auto min-h-[220px] bg-primary">
                  <img
                    src={getThumb(featuredVideo)}
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white mr-1" fill="white" />
                    </div>
                  </div>
                  {featuredVideo.duration && (
                    <div className="absolute bottom-3 left-3 bg-black/80 text-white px-2.5 py-1 rounded text-sm font-medium">
                      {featuredVideo.duration}
                    </div>
                  )}
                  {featuredVideo.category && (
                    <div className="absolute top-3 right-3 bg-secondary text-primary px-3 py-1 rounded-full text-sm font-semibold shadow">
                      {featuredVideo.category}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  {featuredVideo.isNew && (
                    <span className="inline-block bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">
                      שיעור חדש
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-primary mb-3 group-hover:text-secondary transition-colors leading-snug">
                    {featuredVideo.title}
                  </h2>
                  {featuredVideo.description && (
                    <p className="text-muted-foreground mb-5 leading-relaxed text-sm line-clamp-3">
                      {featuredVideo.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {featuredVideo.date && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 flex-shrink-0" />{featuredVideo.date}
                      </span>
                    )}
                    {featuredVideo.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 flex-shrink-0" />{featuredVideo.duration}
                      </span>
                    )}
                    {featuredVideo.views > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4 flex-shrink-0" />{featuredVideo.views.toLocaleString()} צפיות
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Results count + scroll anchor ── */}
        <div ref={gridRef} className="scroll-mt-24 mb-4">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilter
              ? `${filtered.length} תוצאות`
              : `${videos.length} שיעורים`}
          </p>
        </div>

        {/* ── Video grid ── */}
        {pageVideos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">לא נמצאו שיעורים</p>
            <button type="button" onClick={clearFilters} className="text-secondary hover:underline text-sm">
              נקה סינון
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pageVideos.map((video) => <VideoCard key={video.linkId} video={video} />)}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav className="flex justify-center items-center gap-1 sm:gap-2 mt-10 flex-wrap" aria-label="ניווט בין דפים">
            <Button
              variant="outline" size="icon"
              className="rounded-full h-11 w-11"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              aria-label="דף קודם"
            >
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
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <Button
                    key={n}
                    variant={n === page ? 'default' : 'outline'}
                    onClick={() => goToPage(n as number)}
                    className={`rounded-full h-11 w-11 ${n === page ? 'bg-secondary hover:bg-secondary/90 text-primary' : ''}`}
                    aria-label={`דף ${n}`}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </Button>
                )
              )}

            <Button
              variant="outline" size="icon"
              className="rounded-full h-11 w-11"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              aria-label="דף הבא"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: ShiurItem }) {
  return (
    <Link to={`/shiurei-torah/${video.linkId}`} aria-label={`צפה בשיעור: ${video.title}`} className="block h-full">
      <div className="rounded-xl border border-border bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-primary flex-shrink-0">
          <img
            src={getThumb(video)}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="h-5 w-5 text-white mr-0.5" fill="white" />
            </div>
          </div>
          {video.duration && (
            <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-0.5 rounded text-xs font-medium">
              {video.duration}
            </div>
          )}
          {video.category && (
            <div className="absolute top-2 right-2 bg-secondary text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
              {video.category}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-serif font-bold text-primary mb-1.5 line-clamp-2 group-hover:text-secondary transition-colors text-sm sm:text-base leading-snug">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {video.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
            {video.date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3 flex-shrink-0" />{video.date}
              </span>
            )}
            {video.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 flex-shrink-0" />{video.views.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
