import { Button } from '@/components/ui/button';
import { Clock, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type ShiurEvent } from '@/api/getShiurim';
import { useShiurim } from '@/hooks/useQueries';

const monthNames = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
}

function isPastShiur(event: ShiurEvent): boolean {
  const base = event.dateRaw ? new Date(event.dateRaw) : parseDate(event.date);
  const d = new Date(base);
  const timeMatch = event.time?.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    d.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
  } else {
    d.setHours(23, 59, 59, 0);
  }
  return d < new Date();
}

function isTodayShiur(event: ShiurEvent): boolean {
  const now  = new Date();
  const base = event.dateRaw ? new Date(event.dateRaw) : parseDate(event.date);
  return (
    base.getFullYear() === now.getFullYear() &&
    base.getMonth()    === now.getMonth()    &&
    base.getDate()     === now.getDate()
  );
}

function ShiurCard({ event }: { event: ShiurEvent }) {
  const [day, month] = event.date.split('.');
  const monthLabel   = month ? monthNames[parseInt(month) - 1] : '';
  const today        = isTodayShiur(event);

  return (
    <Link to={`/luach-iruyim/${event.linkId}`}>
      <div className={`flex rounded-xl overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer border-2 ${
        today ? 'border-secondary shadow-sm' : 'border-border'
      }`}>
        {/* Date column */}
        <div className="flex-shrink-0 w-16 sm:w-20 flex flex-col items-center justify-center py-4 px-2 bg-primary">
          <span className="text-2xl sm:text-3xl font-bold text-secondary leading-none">{day}</span>
          <span className="text-[10px] sm:text-xs text-primary-foreground/70 mt-1 font-medium">{monthLabel}</span>
          {today && (
            <span className="mt-1 text-[9px] font-bold text-secondary bg-white/20 rounded-full px-1.5 py-0.5 leading-none">
              היום
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm sm:text-base leading-snug group-hover:text-secondary transition-colors line-clamp-2">
              {event.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {today && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 border border-secondary/30 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                  היום
                </span>
              )}
              {event.category && !today && (
                <span className="text-[10px] sm:text-xs border px-1.5 py-0.5 rounded-full font-medium bg-secondary/10 text-secondary border-secondary/20">
                  {event.category}
                </span>
              )}
            </div>
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
  const { data, isLoading: loading } = useShiurim();
  const shiurim = (data?.shiurim ?? []).filter(s => s.date && !isPastShiur(s)).slice(0, 3);

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
          <Link to="/luach-iruyim">
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
              <ShiurCard key={event.linkId} event={event} />
            ))}
          </div>
        )}

        {/* Mobile button */}
        <div className="text-center mt-6 sm:hidden">
          <Link to="/luach-iruyim">
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
