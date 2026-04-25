import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Printer, Share2, ExternalLink, Clock, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SEO from '@/components/SEO';
import { getArticleByLinkId, type ArticleDetail } from '@/api/getArticleByLinkId';
import { type Article } from '@/api/getArticles';
import { useArticles } from '@/hooks/useQueries';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: allArticlesData } = useArticles();
  const allArticles = allArticlesData?.articles ?? [];
  const idx = id ? allArticles.findIndex((a: Article) => a.linkId === id) : -1;
  const prevArticle: Article | null = idx !== -1 ? (allArticles[idx + 1] ?? null) : null;
  const nextArticle: Article | null = idx !== -1 ? (allArticles[idx - 1] ?? null) : null;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getArticleByLinkId(id)
      .then((data) => {
        if (!data) setError('המאמר לא נמצא');
        else setArticle(data);
      })
      .catch(() => setError('שגיאה בטעינת המאמר'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 space-y-6">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-destructive text-lg">{error ?? 'המאמר לא נמצא'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SEO
        title={article.title}
        description={(article.abstract ?? '').slice(0, 155) || `מאמר מאת הרב קלמן מאיר בר: ${article.title}`}
        type="article"
      />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <Breadcrumbs items={[
          { label: 'דף הבית', href: '/' },
          { label: 'הגות ופסיקה', href: '/hagut-upsika' },
          { label: article.categories[0] ?? '', href: `/hagut-upsika?category=${article.categories[0]}` },
          { label: article.title }
        ]} />

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* תוכן ראשי */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* כותרת ומטא-דאטה */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-4 sm:mb-6">{article.title}</h1>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-sm">
                  {article.journal && (
                    <div>
                      <p className="text-muted-foreground">כתב עת</p>
                      <Link to={`/hagut-upsika?journal=${article.journal}`} className="font-medium hover:text-primary">{article.journal}</Link>
                    </div>
                  )}
                  {article.yeshiva && (
                    <div>
                      <p className="text-muted-foreground">ישיבה</p>
                      <Link to={`/hagut-upsika?yeshiva=${article.yeshiva}`} className="font-medium hover:text-primary">{article.yeshiva}</Link>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">שנה</p>
                    <Link to={`/hagut-upsika?year=${article.yearEnglish}`} className="font-medium hover:text-primary">
                      {article.yearHebrew} {article.yearEnglish ? `(${article.yearEnglish})` : ''}
                    </Link>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.categories.map((cat) => (
                    <Link key={cat} to={`/hagut-upsika?category=${cat}`}>
                      <Badge variant="secondary" className="cursor-pointer">{cat}</Badge>
                    </Link>
                  ))}
                  {article.tags.map((tag) => (
                    <Link key={tag} to={`/hagut-upsika?tag=${tag}`}>
                      <Badge variant="outline" className="cursor-pointer">{tag}</Badge>
                    </Link>
                  ))}
                </div>
                {article.readTime && (
                  <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {article.readTime}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* תקציר */}
            {article.abstract && (
              <Card className="bg-amber-50 border-r-4 border-r-secondary">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-serif font-bold mb-3">תקציר</h2>
                  <p className="leading-relaxed text-sm sm:text-base">{article.abstract}</p>
                </CardContent>
              </Card>
            )}

            {/* תוכן מלא */}
            {article.fullContent && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="prose prose-sm sm:prose !max-w-none w-full text-sm sm:text-base leading-relaxed
                      prose-headings:font-serif prose-headings:font-bold
                      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                      prose-p:mb-3 prose-li:mb-1
                      prose-strong:font-bold prose-em:italic">
                    <ReactMarkdown disallowedElements={['script', 'iframe', 'object', 'embed']} unwrapDisallowed>
                      {article.fullContent.replace(/\n(?!\n)/g, '\n\n')}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* כפתורי פעולה */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
                  {article.pdfUrl && (
                    <a href={article.pdfUrl} download target="_blank" rel="noopener noreferrer" className="sm:flex-1">
                      <Button className="w-full gap-2 bg-secondary text-primary hover:bg-secondary/90">
                        <Download className="h-4 w-4" />
                        הורד PDF
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    className="sm:flex-1 gap-2"
                    onClick={() => window.open(article.pdfUrl || window.location.href, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    פתח בחלון
                  </Button>
                  <Button
                    variant="outline"
                    className="sm:flex-1 gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                    הדפס
                  </Button>
                  <Button
                    variant="outline"
                    className="sm:flex-1 gap-2"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: article.title, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    שתף
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* נקודות מפתח */}
            {article.keyPoints.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-serif font-bold mb-3">נקודות מפתח</h2>
                  <ul className="space-y-3">
                    {article.keyPoints.map((point, i) => (
                      <li key={i} className="flex gap-3 text-sm sm:text-base">
                        <span className="text-secondary text-xl shrink-0">✦</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* מקורות */}
            {article.sources && (
              <Card className="bg-amber-50 border-secondary">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-serif font-bold mb-3">מקורות ומראי מקום</h2>
                  <p className="leading-relaxed text-sm sm:text-base">{article.sources}</p>
                </CardContent>
              </Card>
            )}

            {/* ניווט */}
            <div className="flex flex-wrap justify-between gap-2">
              {prevArticle ? (
                <Link to={`/hagut-upsika/${prevArticle.linkId}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ChevronRight className="h-4 w-4" />
                    <span className="hidden sm:inline">המאמר הקודם</span>
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="gap-1" disabled>
                  <ChevronRight className="h-4 w-4" />
                  <span className="hidden sm:inline">המאמר הקודם</span>
                </Button>
              )}
              <Link to="/hagut-upsika">
                <Button variant="outline" size="sm">חזרה לכל המאמרים</Button>
              </Link>
              {nextArticle ? (
                <Link to={`/hagut-upsika/${nextArticle.linkId}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <span className="hidden sm:inline">המאמר הבא</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="gap-1" disabled>
                  <span className="hidden sm:inline">המאמר הבא</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-bold mb-3">סינון מהיר</h3>
                <div className="space-y-2 sm:space-y-3">
                  {article.journal && (
                    <Link to={`/hagut-upsika?journal=${article.journal}`}>
                      <Button variant="outline" size="sm" className="w-full justify-start text-right">כל המאמרים מ{article.journal}</Button>
                    </Link>
                  )}
                  {article.categories[0] && (
                    <Link to={`/hagut-upsika?category=${article.categories[0]}`}>
                      <Button variant="outline" size="sm" className="w-full justify-start text-right">כל המאמרים ב{article.categories[0]}</Button>
                    </Link>
                  )}
                  {article.yearHebrew && (
                    <Link to={`/hagut-upsika?year=${article.yearEnglish}`}>
                      <Button variant="outline" size="sm" className="w-full justify-start text-right">כל המאמרים מ{article.yearHebrew}</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
