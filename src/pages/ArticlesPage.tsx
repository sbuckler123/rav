import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Grid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { getArticles, type Article } from '@/api/getArticles';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArticlesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getArticles()
      .then(({ articles }) => setArticles(articles))
      .catch(() => setError('שגיאה בטעינת המאמרים'))
      .finally(() => setLoading(false));
  }, []);

  const allCategories = [...new Set(articles.flatMap((a) => a.categories))].sort();
  const allYears = [...new Set(articles.map((a) => a.year).filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a)));

  const filteredArticles = articles.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      a.title.toLowerCase().includes(q) ||
      a.abstract?.toLowerCase().includes(q) ||
      a.categories.some((c) => c.toLowerCase().includes(q)) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === '' || a.categories.includes(selectedCategory);
    const matchesYear = selectedYear === '' || a.year === selectedYear;
    return matchesSearch && matchesCategory && matchesYear;
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="מאמרים ופסקי הלכה"
        subtitle="פסקי הלכה, מאמרים תורניים וחידושים מעט הרב הראשי"
      />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        {/* Filter Bar */}
        <Card className="mb-8 bg-[#FAF8F2]">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="sm:col-span-2 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="text"
                  placeholder="חפש מאמר..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 min-h-[44px]"
                  aria-label="חיפוש מאמרים"
                />
              </div>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v === 'all' ? '' : v)}>
                <SelectTrigger className="min-h-[44px] bg-white" aria-label="בחר קטגוריה">
                  <SelectValue placeholder="כל הקטגוריות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v === 'all' ? '' : v)}>
                <SelectTrigger className="min-h-[44px] bg-white" aria-label="בחר שנה">
                  <SelectValue placeholder="כל השנים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל השנים</SelectItem>
                  {allYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  נמצאו <span className="font-bold text-foreground">{filteredArticles.length}</span> מאמרים
                </span>
                {(searchQuery || selectedCategory || selectedYear) && (
                  <Button size="sm" variant="outline" className="min-h-[36px] text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedYear(''); }}>
                    נקה סינון
                  </Button>
                )}
              </div>
              <div className="flex gap-2" role="group" aria-label="בחר תצוגה">
                <Button size="icon" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')} aria-label="תצוגת רשימה" aria-pressed={viewMode === 'list'} className="min-h-[44px] min-w-[44px]">
                  <List className="h-4 w-4" />
                </Button>
                <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')} aria-label="תצוגת רשת" aria-pressed={viewMode === 'grid'} className="min-h-[44px] min-w-[44px]">
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <button type="button" onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedYear(''); }} className="text-secondary hover:underline text-sm">נקה סינון</button>
          </div>
        ) : (
          <>{viewMode === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((article) => (
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
              {filteredArticles.map((article) => (
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
          )}</>
        )}
      </main>
    </div>
  );
}
