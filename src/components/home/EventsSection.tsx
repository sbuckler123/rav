import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getShiurim, type ShiurEvent } from '@/api/getShiurim';

const monthNames = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
}

function ShiurCard({ event }: { event: ShiurEvent }) {
  const [day, month] = event.date.split('.');
  const monthLabel = month ? monthNames[parseInt(month) - 1] : '';

  return (
    <Link to={`/shiurim/${event.linkId}`}>
      <div className="flex border border-border rounded-xl overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
        {/* Date column */}
        <div className="flex-shrink-0 w-16 sm:w-20 flex flex-col items-center justify-center py-4 px-2 bg-primary">
          <span className="text-2xl sm:text-3xl font-bold text-secondary leading-none">{day}</span>
          <span className="text-[10px] sm:text-xs text-primary-foreground/70 mt-1 font-medium">{monthLabel}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm sm:text-base leading-snug group-hover:text-secondary transition-colors line-clamp-2">
              {event.title}
            </h3>
            {event.category && (
              <span className="text-[10px] sm:text-xs border px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium bg-secondary/10 text-secondary border-secondary/20">
                {event.category}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
            {event.time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-secondary flex-shrink-0" />
                {event.time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 text-secondary flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EventsSection() {
  const [shiurim, setShiurim] = useState<ShiurEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShiurim()
      .then(({ shiurim }) => {
        const now = new Date();
        const upcoming = shiurim.filter(s => s.date && parseDate(s.date) >= now);
        setShiurim((upcoming.length > 0 ? upcoming : shiurim).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && shiurim.length === 0) return null;

  return (
    <section className="bg-[#F7F4EE] py-12 sm:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-secondary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">שיעורים קרובים</h2>
          </div>
          <Link to="/shiurim">
            <Button variant="outline" size="sm" className="gap-2 text-sm hidden sm:flex bg-white">
              לכל השיעורים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {shiurim.map(event => (
              <ShiurCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Mobile button */}
        <div className="text-center mt-6 sm:hidden">
          <Link to="/shiurim">
            <Button variant="outline" className="gap-2 w-full bg-white min-h-[44px]">
              לכל השיעורים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
