import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Grid, List, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { getArticles, type Article } from '@/api/getArticles';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArticlesPage() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    getArticles()
      .then(({ articles }) => setArticles(articles))
      .catch(() => setError('שגיאה בטעינת המאמרים'))
      .finally(() => setLoading(false));
  }, []);

  const allCategories = [...new Set(articles.flatMap((a) => a.categories))].sort();
  const allYears = [...new Set(articles.map((a) => a.yearNum > 0 ? String(a.yearNum) : '').filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  const allTags = [...new Set(articles.flatMap((a) => a.tags))].sort();

  const goToPage = (n: number) => {
    setPage(n);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredArticles = articles.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      a.title.toLowerCase().includes(q) ||
      a.abstract?.toLowerCase().includes(q) ||
      a.categories.some((c) => c.toLowerCase().includes(q)) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === '' || a.categories.includes(selectedCategory);
    const matchesYear = selectedYear === '' || String(a.yearNum) === selectedYear;
    const matchesTag = selectedTags.length === 0 || selectedTags.some(t => a.tags.includes(t));
    return matchesSearch && matchesCategory && matchesYear && matchesTag;
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="מאמרים ופסקי הלכה"
        description="מאמרים תורניים ופסקי הלכה מאת הרב קלמן מאיר בר, הרב הראשי לישראל."
      />
      <PageHeader
        title="מאמרים ופסקי הלכה"
        subtitle="פסקי הלכה, מאמרים תורניים וחידושים מעט הרב הראשי"
      />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        {/* Filter Bar */}
        <div className="mb-8 rounded-2xl border border-border/60 bg-[#F7F4EE] p-5 sm:p-6 space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-secondary rounded-full flex-shrink-0" />
            <span className="text-sm font-semibold text-primary">חיפוש וסינון</span>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="text"
              placeholder="חפש לפי כותרת, תקציר, קטגוריה..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pr-11 h-12 bg-white border-border/60 rounded-xl shadow-sm text-sm focus-visible:ring-secondary/30 focus-visible:border-secondary/50"
              aria-label="חיפוש מאמרים"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded"
                aria-label="נקה חיפוש"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Selects row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={selectedCategory || undefined} onValueChange={(v) => { setSelectedCategory(v === '__clear__' ? '' : v); setPage(1); }}>
              <SelectTrigger className={`min-h-[44px] bg-white border-border/60 rounded-xl shadow-sm text-sm ${selectedCategory ? 'border-secondary/50 text-primary font-medium' : ''}`} aria-label="בחר קטגוריה">
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory && <SelectItem value="__clear__">כל הקטגוריות</SelectItem>}
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear || undefined} onValueChange={(v) => { setSelectedYear(v === '__clear__' ? '' : v); setPage(1); }}>
              <SelectTrigger className={`min-h-[44px] bg-white border-border/60 rounded-xl shadow-sm text-sm ${selectedYear ? 'border-secondary/50 text-primary font-medium' : ''}`} aria-label="בחר שנה">
                <SelectValue placeholder="כל השנים" />
              </SelectTrigger>
              <SelectContent>
                {selectedYear && <SelectItem value="__clear__">כל השנים</SelectItem>}
                {allYears.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags multi-select pills */}
          {allTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">תגיות</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          active ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 min-h-[32px] ${
                        active
                          ? 'bg-secondary text-primary border-secondary shadow-sm'
                          : 'bg-white text-muted-foreground border-border/60 hover:border-secondary/50 hover:text-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-border/40">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">
                נמצאו{' '}
                <span className="font-bold text-primary">{filteredArticles.length}</span>
                {' '}מאמרים
              </span>
              {(searchQuery || selectedCategory || selectedYear || selectedTags.length > 0) && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedYear(''); setSelectedTags([]); setPage(1); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  נקה סינון
                </button>
              )}
            </div>
            <div className="flex gap-1.5" role="group" aria-label="בחר תצוגה">
              <button
                onClick={() => setViewMode('list')}
                aria-label="תצוגת רשימה"
                aria-pressed={viewMode === 'list'}
                className={`p-2.5 rounded-lg border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'list' ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border/60 hover:border-primary/40'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="תצוגת רשת"
                aria-pressed={viewMode === 'grid'}
                className={`p-2.5 rounded-lg border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'grid' ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border/60 hover:border-primary/40'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Articles list */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-12">{error}</p>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">לא נמצאו מאמרים</p>
            <button type="button" onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedYear(''); setSelectedTags([]); setPage(1); }} className="text-secondary hover:underline text-sm">נקה סינון</button>
          </div>
        ) : (() => {
          const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ITEMS_PER_PAGE));
          const pageArticles = filteredArticles.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
          return (
          <>{
          <div ref={gridRef} className="scroll-mt-24" />
          }{viewMode === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="h-20 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center mb-3" aria-hidden="true">
                      <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {article.categories.map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                      ))}
                    </div>
                    <Link to={`/articles/${article.linkId}`}>
                      <h2 className="font-bold text-base mb-1 hover:text-primary transition-colors line-clamp-2">{article.title}</h2>
                    </Link>
                    <div className="text-xs text-muted-foreground mb-2">
                      {[article.journal, article.yeshiva, article.year].filter(Boolean).join(' • ')}
                    </div>
                    {article.abstract && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">{article.abstract}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <Link to={`/articles/${article.linkId}`} className="mt-auto">
                      <Button size="sm" variant="outline" className="w-full">לקריאת המאמר</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pageArticles.map((article) => (
                <article key={article.id}>
                  <Card className="hover:shadow-md transition-shadow border-r-4 border-r-secondary/40 hover:border-r-secondary">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* שורה עליונה: קטגוריות + שנה */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {article.categories.map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                            ))}
                            {article.year && (
                              <span className="text-xs text-muted-foreground">{article.year}</span>
                            )}
                          </div>

                          {/* כותרת */}
                          <Link to={`/articles/${article.linkId}`}>
                            <h2 className="font-serif font-bold text-lg sm:text-xl mb-1 hover:text-primary transition-colors">{article.title}</h2>
                          </Link>

                          {/* מטא-דאטה */}
                          <p className="text-sm text-muted-foreground mb-2">
                            {[article.journal, article.yeshiva].filter(Boolean).join(' • ')}
                          </p>

                          {/* תקציר */}
                          {article.abstract && (
                            <p className="text-sm text-foreground/70 line-clamp-2 mb-3">{article.abstract}</p>
                          )}

                          {/* תגיות + כפתור */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {article.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                            <Link to={`/articles/${article.linkId}`}>
                              <Button size="sm" variant="outline" className="shrink-0">לקריאת המאמר</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <nav className="flex justify-center items-center gap-1 sm:gap-2 mt-10 flex-wrap" aria-label="ניווט בין דפים">
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
                    <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
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
          </>);
        })()}
      </main>
    </div>
  );
}
