import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlHaperek } from '@/hooks/useQueries';
import type { AlHaperekItem } from '@/api/getAlHaperek';

function formatDate(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ItemCard({ item }: { item: AlHaperekItem }) {
  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group border border-border h-full">
      <div className="w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex-shrink-0">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-10 w-10 text-primary/30" />
          </div>
        )}
      </div>

      <CardContent className="flex flex-col flex-1 p-4 sm:p-5">
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.slice(0, 2).map(t => (
              <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5">{t}</Badge>
            ))}
          </div>
        )}

        <Link to={`/al-haperek/${item.linkId}`}>
          <h3 className="font-serif font-bold text-base sm:text-lg leading-snug text-primary hover:text-secondary transition-colors line-clamp-2 mb-2">
            {item.title}
          </h3>
        </Link>

        {item.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 mb-3">
            {item.summary}
          </p>
        )}

        <div className="mt-auto space-y-3">
          {item.date && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {formatDate(item.date)}
            </p>
          )}
          <Link to={`/al-haperek/${item.linkId}`}>
            <Button size="sm" variant="outline" className="w-full hover:bg-primary hover:text-white transition-colors">
              לקריאה המלאה
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlHaperekSection() {
  const { data, isLoading } = useAlHaperek();
  const items = (data?.items ?? []).slice(0, 3);

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="bg-[#F7F4EE] py-12 sm:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-secondary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">על הפרק</h2>
          </div>
          <Link to="/al-haperek">
            <Button variant="outline" size="sm" className="gap-2 text-sm hidden sm:flex bg-white">
              לכל הפריטים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => <ItemCard key={item.linkId} item={item} />)}
          </div>
        )}

        <div className="text-center mt-6 sm:hidden">
          <Link to="/al-haperek">
            <Button variant="outline" className="gap-2 w-full min-h-[44px] bg-white">
              לכל הפריטים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
