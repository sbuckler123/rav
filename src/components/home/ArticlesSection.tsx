import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useArticles } from '@/hooks/useQueries';

export default function ArticlesSection() {
  const { data, isLoading: loading } = useArticles();
  const articles = (data?.articles ?? []).slice(0, 4);

  if (!loading && articles.length === 0) return null;

  return (
    <section className="bg-[#F7F4EE] py-12 sm:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-secondary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">מאמרים ופסקי הלכה</h2>
          </div>
          <Link to="/hagut-upsika">
            <Button variant="outline" size="sm" className="gap-2 text-sm hidden sm:flex bg-white">
              לכל המאמרים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <Card
                key={article.linkId}
                className="bg-white hover:shadow-md transition-all border-r-4 border-r-secondary/40 hover:border-r-secondary hover:-translate-y-0.5 duration-200"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Categories + year */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {article.categories.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                        ))}
                        {article.year && (
                          <span className="text-xs text-muted-foreground">{article.year}</span>
                        )}
                      </div>

                      {/* Title */}
                      <Link to={`/hagut-upsika/${article.linkId}`}>
                        <h3 className="font-serif font-bold text-base sm:text-lg mb-1 hover:text-secondary transition-colors line-clamp-1">
                          {article.title}
                        </h3>
                      </Link>

                      {/* Meta */}
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {[article.journal, article.yeshiva].filter(Boolean).join(' • ')}
                      </p>

                      {/* Abstract + button */}
                      <div className="flex items-end justify-between gap-3">
                        {article.abstract && (
                          <p className="text-xs sm:text-sm text-foreground/70 line-clamp-1 flex-1">{article.abstract}</p>
                        )}
                        <Link to={`/hagut-upsika/${article.linkId}`} className="flex-shrink-0">
                          <Button size="sm" variant="outline" className="text-xs h-8 whitespace-nowrap">
                            לקריאת המאמר
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mobile button */}
        <div className="text-center mt-6 sm:hidden">
          <Link to="/hagut-upsika">
            <Button variant="outline" className="gap-2 w-full bg-white min-h-[44px]">
              לכל המאמרים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
