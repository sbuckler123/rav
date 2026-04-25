import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft } from 'lucide-react';
import { useEvents } from '@/hooks/useQueries';
import { getEventTypeStyle } from '@/lib/yoman';

const placeholderImg = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="%231B2A4A"/></svg>'
);

export default function EventsHomeSection() {
  const { data, isLoading: loading } = useEvents();
  const events = (data?.events ?? []).slice(0, 3);

  if (!loading && events.length === 0) return null;

  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-secondary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">אירועים אחרונים</h2>
          </div>
          <Link to="/yoman-peilut">
            <Button variant="outline" size="sm" className="gap-2 text-sm hidden sm:flex">
              לכל האירועים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-muted animate-pulse h-52" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {events.map((event) => {
              const style = getEventTypeStyle(event.eventType);
              const imageUrl = event.mainImageUrl || placeholderImg;
              return (
                <Link key={event.linkId} to={`/yoman-peilut/${event.linkId}`}>
                  <div className="rounded-xl border border-border bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer h-full flex flex-col">
                    {/* Image */}
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-semibold mb-2 w-fit"
                        style={{ backgroundColor: style.bg, color: style.text }}
                      >
                        {event.eventType}
                      </span>
                      <h3 className="font-serif font-bold text-primary text-sm sm:text-base leading-snug mb-2 line-clamp-2 group-hover:text-secondary transition-colors flex-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">{event.dateHebrew} · {event.dateLocale}</p>
                      {event.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0 text-secondary" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Mobile button */}
        <div className="text-center mt-6 sm:hidden">
          <Link to="/yoman-peilut">
            <Button variant="outline" className="gap-2 w-full min-h-[44px]">
              לכל האירועים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
