import { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Download, FileText, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="%23E5E7EB"><rect width="320" height="180" fill="%231B2A4A"/><polygon points="130,60 130,120 190,90" fill="%23C9A84C"/></svg>');
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
  const error = isError ? 'שגיאה בטעינת השיעורים' : null;
  const gridRef = useRef<HTMLDivElement>(null);

  const clearFilters = () => { setSearchQuery(''); setCategoryFilter('all'); setYearFilter('all'); setSortBy('date-desc'); setPage(1); };

  const goToPage = (n: number) => {
    setPage(n);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };;

  const allCategories = useMemo(() => [...new Set(videos.map((v) => v.category).filter(Boolean))], [videos]);
  const allYears = useMemo(() => [...new Set(videos.map((v) => v.dateRaw ? new Date(v.dateRaw).getFullYear().toString() : '').filter(Boolean))].sort((a, b) => Number(b) - Number(a)), [videos]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    videos.forEach((v) => { if (v.category) counts[v.category] = (counts[v.category] ?? 0) + 1; });
    return counts;
  }, [videos]);

  const filtered = useMemo(() => {
    let list = [...videos];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
    }
    if (categoryFilter && categoryFilter !== 'all') list = list.filter((v) => v.category === categoryFilter);
    if (yearFilter && yearFilter !== 'all') list = list.filter((v) => v.dateRaw && new Date(v.dateRaw).getFullYear().toString() === yearFilter);
    if (sortBy === 'date-asc') list.sort((a, b) => a.dateRaw.localeCompare(b.dateRaw));
    else if (sortBy === 'views') list.sort((a, b) => b.views - a.views);
    return list;
  }, [videos, searchQuery, categoryFilter, yearFilter, sortBy]);

  const hasActiveFilter = searchQuery.trim() !== '' || categoryFilter !== 'all' || yearFilter !== 'all';
  const featuredVideo = !hasActiveFilter ? (videos.find((v) => v.isNew) ?? videos[0]) : null;
  const gridVideos = featuredVideo ? filtered.filter((v) => v.id !== featuredVideo.id) : filtered;
  const totalPages = Math.max(1, Math.ceil(gridVideos.length / ITEMS_PER_PAGE));
  const pageVideos = gridVideos.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="שיעורי תורה" subtitle={PAGE_DESC['/shiurei-torah']} />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-16 text-center text-muted-foreground">טוען שיעורים...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="שיעורי תורה" subtitle={PAGE_DESC['/shiurei-torah']} />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-16 text-center text-destructive">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="שיעורי תורה"
        description="צפו בשיעורי התורה של הרב קלמן מאיר בר — שיעורי תורה, הלכה ומחשבה מהרב הראשי לישראל."
      />
      <PageHeader title="שיעורי תורה" subtitle={PAGE_DESC['/shiurei-torah']} />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <main className="lg:col-span-3" aria-label="שיעורי וידאו">
            {/* Filter Bar */}
            <Card className="mb-8 shadow-md bg-[#FAF8F2]">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        type="text"
                        placeholder="חפש שיעור..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pr-10 min-h-[44px] bg-white"
                        aria-label="חיפוש שיעור"
                      />
                    </div>

                    <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                      <SelectTrigger className="min-h-[44px] bg-white" aria-label="בחר קטגוריה">
                        <SelectValue placeholder="כל הקטגוריות">
                          {categoryFilter === 'all' ? 'כל הקטגוריות' : categoryFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">כל הקטגוריות</SelectItem>
                        {allCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(1); }}>
                      <SelectTrigger className="min-h-[44px] bg-white" aria-label="בחר שנה">
                        <SelectValue placeholder="כל השנים">
                          {yearFilter === 'all' ? 'כל השנים' : yearFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">כל השנים</SelectItem>
                        {allYears.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="min-h-[44px] bg-white" aria-label="מיון">
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
                  </div>

                  {hasActiveFilter && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={clearFilters} className="min-h-[44px]">
                        <X className="h-4 w-4 ml-2" aria-hidden="true" />
                        נקה סינון
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Video */}
            {featuredVideo && (
              <Link to={`/shiurei-torah/${featuredVideo.linkId}`} aria-label={`צפה בשיעור: ${featuredVideo.title}`}>
                <Card className="mb-10 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <div className="relative h-56 sm:h-64 lg:h-auto bg-primary">
                      <img
                        src={getThumb(featuredVideo)}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center" aria-hidden="true">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                          <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white mr-1" fill="white" aria-hidden="true" />
                        </div>
                      </div>
                      {featuredVideo.duration && <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-semibold">{featuredVideo.duration}</div>}
                      {featuredVideo.category && <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg">{featuredVideo.category}</div>}
                    </div>
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                      {featuredVideo.isNew && (
                        <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">שיעור חדש</span>
                      )}
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary mb-4 group-hover:text-secondary transition-colors">
                        {featuredVideo.title}
                      </h2>
                      <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base">{featuredVideo.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
                        {featuredVideo.date && <span>📅 {featuredVideo.date}</span>}
                        {featuredVideo.duration && <span>⏱️ {featuredVideo.duration}</span>}
                        {featuredVideo.views > 0 && <span>👁️ {featuredVideo.views.toLocaleString()} צפיות</span>}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground min-h-[44px]">
                          <Play className="h-4 w-4 ml-2" aria-hidden="true" />
                          צפייה
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {/* Video Grid */}
            <div ref={gridRef} className="scroll-mt-24" />
            {pageVideos.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg mb-2">לא נמצאו שיעורים</p>
                <button type="button" onClick={clearFilters} className="text-secondary hover:underline text-sm">נקה סינון</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                {pageVideos.map((video) => <VideoCard key={video.linkId} video={video} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex justify-center items-center gap-1 sm:gap-2 mt-12 flex-wrap" aria-label="ניווט בין דפים">
                <Button variant="outline" size="icon" className="rounded-full min-h-[44px] min-w-[44px]" disabled={page <= 1} onClick={() => goToPage(page - 1)} aria-label="דף קודם">
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
                      <Button key={n} variant={n === page ? 'default' : 'outline'} onClick={() => goToPage(n as number)} className={`rounded-full min-h-[44px] min-w-[44px] w-11 h-11 ${n === page ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : ''}`} aria-label={`דף ${n}`} aria-current={n === page ? 'page' : undefined}>
                        {n}
                      </Button>
                    )
                  )}
                <Button variant="outline" size="icon" className="rounded-full min-h-[44px] min-w-[44px]" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} aria-label="דף הבא">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-6" aria-label="קטגוריות">
            <Card className="p-6 bg-[#FAF8F2]">
              <h2 className="font-serif font-bold text-lg text-primary mb-4">קטגוריות</h2>
              <ul className="space-y-3" role="list">
                {allCategories.map((cat) => (
                  <li key={cat}>
                    <button
                      className="w-full text-right hover:text-secondary transition-colors flex justify-between items-center min-h-[44px]"
                      onClick={() => { setCategoryFilter(cat === categoryFilter ? 'all' : cat); setPage(1); }}
                      aria-label={`סנן לפי ${cat}`}
                    >
                      <span className={categoryFilter === cat ? 'text-secondary font-semibold' : ''}>{cat}</span>
                      <span className="text-sm text-muted-foreground">({categoryCounts[cat] ?? 0})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: ShiurItem }) {
  const thumbnailUrl = getThumb(video);
  return (
    <Link to={`/shiurei-torah/${video.linkId}`} aria-label={`צפה בשיעור: ${video.title}`} className="h-full block">
      <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:bg-[#F5F0E8] transition-all duration-300 cursor-pointer group h-full flex flex-col">
        <div className="relative aspect-video bg-primary flex-shrink-0">
          <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center" aria-hidden="true">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white mr-1" fill="white" />
            </div>
          </div>
          {video.duration && <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-0.5 rounded text-xs font-semibold">{video.duration}</div>}
          {video.category && <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-semibold shadow-md">{video.category}</div>}
        </div>
        <CardContent className="p-4 flex flex-col flex-1">
          <h3 className="font-serif font-bold text-primary mb-2 line-clamp-2 group-hover:text-secondary transition-colors text-sm sm:text-base flex-1">{video.title}</h3>
          <p className="text-sm text-muted-foreground mb-1">{video.date}{video.duration ? ` • ${video.duration}` : ''}</p>
          {video.views > 0 && (
            <p className="text-xs text-muted-foreground">{video.views.toLocaleString()} צפיות</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
