import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Share2, Printer, ChevronRight, ChevronLeft,
  X, Clock, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Breadcrumbs from '@/components/Breadcrumbs';
import SEO from '@/components/SEO';
import { getEventByLinkId, type EventDetail } from '@/api/getEventByLinkId';
import { getEvents, type EventItem } from '@/api/getEvents';
import { getEventTypeStyle } from '@/lib/yoman';

export default function EventDetailPage() {
  const { id } = useParams<string>();
  const [entry, setEntry] = useState<EventDetail | null | undefined>(undefined);
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([]);
  const [prevEvent, setPrevEvent] = useState<EventItem | null>(null);
  const [nextEvent, setNextEvent] = useState<EventItem | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) { setEntry(null); return; }
    getEventByLinkId(id).then(setEntry).catch(() => setEntry(null));
    getEvents().then(({ events }) => {
      setRecentEvents(events.filter((e) => e.linkId !== id).slice(0, 4));
      const idx = events.findIndex((e) => e.linkId === id);
      if (idx !== -1) {
        setPrevEvent(events[idx + 1] ?? null); // older (desc order)
        setNextEvent(events[idx - 1] ?? null); // newer (desc order)
      }
    }).catch(() => {});
  }, [id]);

  const openLightbox = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const nextImage = useCallback(() => {
    if (!entry) return;
    setCurrentImageIndex((prev) => (prev + 1) % entry.gallery.length);
  }, [entry]);

  const prevImage = useCallback(() => {
    if (!entry) return;
    setCurrentImageIndex((prev) => (prev - 1 + entry.gallery.length) % entry.gallery.length);
  }, [entry]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') prevImage();
      if (e.key === 'ArrowLeft') nextImage();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, prevImage, nextImage]);

  if (entry === undefined) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-16 text-center text-muted-foreground">
        טוען...
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 text-center">
        <p className="text-muted-foreground">הרשומה לא נמצאה.</p>
        <Link to="/yoman-peilut">
          <Button variant="outline" className="mt-4">חזרה ליומן פעילות</Button>
        </Link>
      </div>
    );
  }

  const eventStyle = getEventTypeStyle(entry.eventType);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={entry.title}
        description={`אירוע של הרב קלמן מאיר בר: ${entry.title}`}
      />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <Breadcrumbs
          items={[
            { label: 'דף הבית', href: '/' },
            { label: 'יומן פעילות', href: '/yoman-peilut' },
            { label: entry.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-8">
          {/* תוכן ראשי */}
          <div className="space-y-8">
            {/* כותרת + מטא-דאטה */}
            <header>
              <span
                className="inline-block rounded px-2.5 py-1 text-sm font-medium mb-3"
                style={{ backgroundColor: eventStyle.bg, color: eventStyle.text }}
              >
                {entry.eventType}
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-3">
                {entry.title}
              </h1>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{entry.dateHebrew} · {entry.dateLocale}</span>
                {entry.location && (<><span>|</span><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{entry.location}</span></>)}
                {entry.duration && (<><span>|</span><span>{entry.duration}</span></>)}
              </p>
              <div className="w-20 h-1 rounded-full bg-secondary mt-4" style={{ height: '4px' }} aria-hidden />
            </header>

            {/* גלריית תמונות */}
            {entry.gallery.length > 0 && (
              <section>
                <div className="rounded-lg overflow-hidden border border-primary/20 mb-4">
                  <button
                    type="button"
                    onClick={() => openLightbox(0)}
                    className="block w-full aspect-video overflow-hidden focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <img
                      src={entry.gallery[0].url}
                      alt={entry.gallery[0].caption || entry.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {entry.gallery[0].caption && (
                    <p className="text-sm text-muted-foreground text-center py-2 px-4 bg-muted/30">
                      {entry.gallery[0].caption}
                    </p>
                  )}
                </div>
                {entry.gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {entry.gallery.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => openLightbox(idx)}
                        className="shrink-0 w-32 h-24 rounded-md overflow-hidden border border-border hover:border-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                      >
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* תיאור */}
            {entry.teurDescription && (
              <p className="font-sans text-base md:text-lg leading-[1.75] text-muted-foreground">
                {entry.teurDescription}
              </p>
            )}

            {/* תיאור מלא */}
            {entry.description && (
              <section>
                {entry.description.split('\n').filter(Boolean).map((paragraph, idx) => (
                  <p key={idx} className="font-sans text-base md:text-lg leading-[1.75] text-foreground mb-4">
                    {paragraph}
                  </p>
                ))}
              </section>
            )}

            {/* ציטוטים */}
            {entry.quotes.length > 0 && (
              <section className="space-y-6">
                {entry.quotes.map((q, idx) => (
                  <blockquote
                    key={idx}
                    className="rounded-lg p-6 border-r-4 border-secondary font-serif text-xl md:text-[22px] leading-relaxed text-primary font-medium"
                    style={{ backgroundColor: '#FAF8F2' }}
                  >
                    <p className="mb-3">&quot;{q.text}&quot;</p>
                    <footer className="font-sans text-sm font-normal text-muted-foreground">— {q.author}</footer>
                  </blockquote>
                ))}
              </section>
            )}

            {/* לוח זמנים */}
            {entry.schedule.length > 0 && (
              <section>
                <h2 className="font-serif font-bold text-xl text-primary mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  לוח זמנים
                </h2>
                <div className="relative pr-6">
                  <div className="absolute top-0 bottom-0 w-0.5 rounded-full bg-secondary" style={{ right: '3px' }} aria-hidden />
                  <ul className="space-y-5">
                    {entry.schedule.map((item, idx) => (
                      <li key={idx} className="relative flex gap-4">
                        <span className="absolute h-2.5 w-2.5 rounded-full bg-secondary border-2 border-white shrink-0" style={{ right: '0', top: '0.25rem' }} aria-hidden />
                        <div className="mr-6">
                          <span className="font-bold text-primary text-base">{item.time}</span>
                          <span className="text-foreground text-[15px] mr-2"> {item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* כפתורי פעולה */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: entry.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href).then(() => alert('הקישור הועתק!'));
                  }
                }}
              >
                <Share2 className="h-4 w-4 ml-2" />
                שתף
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 ml-2" />
                הדפס
              </Button>
            </div>

            {/* ניווט בין אירועים */}
            <nav
              className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-border rounded-b-lg px-4 -mx-4"
              style={{ backgroundColor: '#FAF8F2' }}
              aria-label="ניווט בין אירועים"
            >
              <div className="flex-1 min-w-0 text-left">
                {prevEvent ? (
                  <Link to={`/yoman-peilut/${prevEvent.linkId}`} className="group block hover:bg-primary/5 rounded p-2 -m-2 transition-colors">
                    <span className="text-sm text-muted-foreground">→ האירוע הקודם</span>
                    <span className="block font-semibold text-primary group-hover:text-secondary truncate">{prevEvent.title}</span>
                  </Link>
                ) : (
                  <span className="text-muted-foreground text-sm">אין אירוע קודם</span>
                )}
              </div>
              <Link to="/yoman-peilut" className="text-primary font-medium hover:text-secondary text-sm shrink-0">
                חזרה ליומן פעילות
              </Link>
              <div className="flex-1 min-w-0 text-right">
                {nextEvent ? (
                  <Link to={`/yoman-peilut/${nextEvent.linkId}`} className="group block hover:bg-primary/5 rounded p-2 -m-2 transition-colors">
                    <span className="text-sm text-muted-foreground">האירוע הבא ←</span>
                    <span className="block font-semibold text-primary group-hover:text-secondary truncate">{nextEvent.title}</span>
                  </Link>
                ) : (
                  <span className="text-muted-foreground text-sm">אין אירוע הבא</span>
                )}
              </div>
            </nav>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Recent events */}
            {recentEvents.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-serif font-bold text-lg text-primary mb-3 pb-2 border-b-2 border-secondary w-fit">
                  אירועים נוספים
                </h3>
                <ul className="space-y-3">
                  {recentEvents.map((e) => (
                    <li key={e.id}>
                      <Link
                        to={`/yoman-peilut/${e.linkId}`}
                        className="flex gap-3 rounded-lg p-2 hover:bg-[#F5F0E8] transition-colors group"
                      >
                        {e.mainImageUrl ? (
                          <img
                            src={e.mainImageUrl}
                            alt={e.title}
                            className="h-14 w-20 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-14 w-20 shrink-0 rounded bg-[#E5E7EB] flex items-center justify-center">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-medium text-primary group-hover:text-secondary text-sm line-clamp-2 block">
                            {e.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{e.dateHebrew}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Back to events */}
            <div className="rounded-lg p-6 text-primary-foreground" style={{ backgroundColor: '#1B2A4A' }}>
              <p className="font-serif font-bold mb-3">כל האירועים</p>
              <Button asChild size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full">
                <Link to="/yoman-peilut" className="flex items-center justify-center gap-2">
                  חזרה ליומן פעילות
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && entry.gallery.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          role="dialog"
          aria-modal="true"
          aria-label="תצוגת תמונה"
        >
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white hover:bg-white/20" onClick={() => setLightboxOpen(false)} aria-label="סגור">
            <X className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={prevImage} aria-label="תמונה קודמת">
            <ChevronRight className="h-8 w-8" />
          </Button>
          <div className="max-w-4xl w-full">
            <img
              src={entry.gallery[currentImageIndex].url}
              alt={entry.gallery[currentImageIndex].caption}
              className="w-full h-auto rounded-lg mx-auto"
            />
            {entry.gallery[currentImageIndex].caption && (
              <p className="text-white text-center mt-4 text-sm">{entry.gallery[currentImageIndex].caption}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={nextImage} aria-label="תמונה הבאה">
            <ChevronLeft className="h-8 w-8" />
          </Button>
        </div>
      )}
    </div>
  );
}
