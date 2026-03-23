import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Calendar, Clock, MapPin, Share2, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getShiurim, type ShiurEvent } from '@/api/getShiurim';

const monthNames = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
const monthNamesFull = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export default function ShiurDetailPage() {
  const { id } = useParams();
  const [shiurim, setShiurim] = useState<ShiurEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShiurim()
      .then(({ shiurim }) => setShiurim(shiurim))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">טוען שיעור...</p>
      </div>
    );
  }

  const shiur = shiurim.find((s) => s.linkId === id);

  if (!shiur) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">השיעור לא נמצא</p>
          <Button asChild><Link to="/shiurim">חזרה ללוח שיעורים</Link></Button>
        </div>
      </div>
    );
  }

  const idx = shiurim.findIndex((s) => s.linkId === id);
  const prevShiur = shiurim[idx + 1] ?? null;
  const nextShiur = shiurim[idx - 1] ?? null;
  const upcomingShiurim = shiurim.filter((s) => s.linkId !== id).slice(0, 4);

  const [day, month, year] = shiur.date.split('.');
  const monthLabel = month ? monthNames[parseInt(month) - 1] : '';
  const monthFull = month ? monthNamesFull[parseInt(month) - 1] : '';

  const handleAddToCalendar = () => {
    // Build YYYYMMDD date string
    const dateStr = `${year}${month}${day}`;

    let dtStart: string;
    let dtEnd: string;
    let allDay = false;

    const timeMatch = shiur.time ? shiur.time.match(/(\d{1,2}):(\d{2})/) : null;
    if (timeMatch) {
      const h = timeMatch[1].padStart(2, '0');
      const m = timeMatch[2];
      const endH = String(parseInt(h) + 1).padStart(2, '0');
      dtStart = `${dateStr}T${h}${m}00`;
      dtEnd = `${dateStr}T${endH}${m}00`;
    } else {
      allDay = true;
      dtStart = dateStr;
      dtEnd = dateStr;
    }

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RavApp//HE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${shiur.id}@ravapp`,
      allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
      allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
      `SUMMARY:${shiur.title}`,
      shiur.location ? `LOCATION:${shiur.location}` : null,
      shiur.description ? `DESCRIPTION:${shiur.description.replace(/[\r\n]+/g, '\\n')}` : null,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shiur.title}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('קובץ היומן הורד — פתח אותו להוספה ליומן');
  };

  const handleShare = async () => {
    const url = window.location.href;

    // Native share sheet — works on mobile (Android/iOS) and modern desktop
    if (navigator.share) {
      try {
        await navigator.share({ title: shiur.title, url });
        return;
      } catch (err: any) {
        // User cancelled — not an error
        if (err?.name === 'AbortError') return;
      }
    }

    // Clipboard API (HTTPS / localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('הקישור הועתק ללוח!');
        return;
      } catch {}
    }

    // Last-resort fallback via hidden input (works on HTTP too)
    try {
      const input = document.createElement('input');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.focus();
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      toast.success('הקישור הועתק ללוח!');
    } catch {
      toast.error('לא ניתן להעתיק את הקישור');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-4">
          <Breadcrumbs
            items={[
              { label: 'דף הבית', href: '/' },
              { label: 'לוח שיעורים', href: '/shiurim' },
              { label: shiur.title }
            ]}
          />
        </div>
      </div>

      {/* Title area */}
      <div className="bg-[#F7F4EE] border-b">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-6 sm:py-10">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Date badge */}
            {shiur.date && (
              <div className="hidden sm:flex flex-col items-center justify-center bg-primary rounded-xl px-4 py-3 flex-shrink-0 text-primary-foreground min-w-[64px]">
                <span className="text-2xl font-bold text-secondary leading-none">{day}</span>
                <span className="text-xs text-primary-foreground/70 mt-0.5">{monthLabel}</span>
                <span className="text-xs text-primary-foreground/50">{year}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {shiur.category && (
                <span className="inline-block text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/25 px-3 py-1 rounded-full mb-3">
                  {shiur.category}
                </span>
              )}
              <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-bold leading-snug text-primary mb-3 sm:mb-4 break-words">
                {shiur.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                {shiur.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-secondary flex-shrink-0" />
                    {day} {monthFull} {year}
                  </span>
                )}
                {shiur.time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-secondary flex-shrink-0" />
                    {shiur.time}
                  </span>
                )}
                {shiur.location && (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="truncate">{shiur.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">

            {/* תיאור */}
            {shiur.description && (
              <Card className="border shadow-sm bg-white">
                <CardContent className="p-5 sm:p-7">
                  <h2 className="text-base sm:text-lg font-serif font-bold mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-secondary rounded-full inline-block" />
                    אודות השיעור
                  </h2>
                  <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
                    {shiur.description.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* פרטים */}
            <Card className="border shadow-sm bg-white">
              <CardContent className="p-5 sm:p-7">
                <h2 className="text-base sm:text-lg font-serif font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-secondary rounded-full inline-block" />
                  פרטי השיעור
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {shiur.date && (
                    <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-secondary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">תאריך</p>
                        <p className="font-medium text-sm">{day} {monthFull} {year}</p>
                      </div>
                    </div>
                  )}
                  {shiur.time && (
                    <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-lg">
                      <Clock className="h-5 w-5 text-secondary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">שעה</p>
                        <p className="font-medium text-sm">{shiur.time}</p>
                      </div>
                    </div>
                  )}
                  {shiur.location && (
                    <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-lg sm:col-span-2">
                      <MapPin className="h-5 w-5 text-secondary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">מיקום</p>
                        <p className="font-medium text-sm">{shiur.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="gap-2 bg-secondary text-primary hover:bg-secondary/90 min-h-[44px] w-full sm:w-auto"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                שתף שיעור
              </Button>
              <Button variant="outline" className="min-h-[44px] w-full sm:w-auto" asChild>
                <Link to="/shiurim">חזרה ללוח שיעורים</Link>
              </Button>
            </div>

            {/* ניווט */}
            <div className="flex justify-between gap-2 sm:gap-3 pt-2 border-t">
              {prevShiur ? (
                <Link to={`/shiurim/${prevShiur.linkId}`} className="flex-1">
                  <Button variant="outline" className="gap-1.5 sm:gap-2 w-full min-h-[44px] text-sm">
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">השיעור הקודם</span>
                    <span className="sm:hidden">קודם</span>
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="gap-1.5 sm:gap-2 flex-1 min-h-[44px] text-sm" disabled>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">השיעור הקודם</span>
                  <span className="sm:hidden">קודם</span>
                </Button>
              )}
              {nextShiur ? (
                <Link to={`/shiurim/${nextShiur.linkId}`} className="flex-1">
                  <Button variant="outline" className="gap-1.5 sm:gap-2 w-full min-h-[44px] text-sm">
                    <span className="hidden sm:inline">השיעור הבא</span>
                    <span className="sm:hidden">הבא</span>
                    <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="gap-1.5 sm:gap-2 flex-1 min-h-[44px] text-sm" disabled>
                  <span className="hidden sm:inline">השיעור הבא</span>
                  <span className="sm:hidden">הבא</span>
                  <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 order-1 lg:order-2">
            {upcomingShiurim.length > 0 && (
              <Card className="border shadow-sm bg-white">
                <CardContent className="p-4 sm:p-5">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-secondary rounded-full inline-block" />
                    שיעורים נוספים
                  </h3>
                  <div className="space-y-1">
                    {upcomingShiurim.map((s) => {
                      const [sDay, sMonth] = s.date.split('.');
                      const sMonthLabel = sMonth ? monthNames[parseInt(sMonth) - 1] : '';
                      return (
                        <Link key={s.id} to={`/shiurim/${s.linkId}`}>
                          <div className="flex gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer">
                            {s.date && (
                              <div className="flex-shrink-0 w-10 h-10 bg-[#F7F4EE] border rounded-lg flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-primary leading-none">{sDay}</span>
                                <span className="text-[9px] text-muted-foreground">{sMonthLabel}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2 group-hover:text-secondary transition-colors">
                                {s.title}
                              </p>
                              {s.time && (
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />{s.time}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <Link to="/shiurim">
                    <Button variant="outline" size="sm" className="w-full mt-3 min-h-[40px] sm:min-h-0 text-xs">
                      כל לוח השיעורים
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Card className="border shadow-sm bg-white">
              <CardContent className="p-4 sm:p-5 text-center">
                <Calendar className="h-8 w-8 text-secondary mx-auto mb-2" />
                <h3 className="font-bold text-sm mb-1">הוסף ליומן</h3>
                <p className="text-xs text-muted-foreground mb-3">אל תפספס את השיעור הקרוב</p>
                <Button
                  className="w-full bg-secondary text-primary hover:bg-secondary/90 min-h-[44px]"
                  onClick={handleAddToCalendar}
                >
                  הוסף ליומן
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
