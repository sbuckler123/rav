import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, MessageCircle, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getShiurim, type ShiurEvent } from '@/api/getShiurim';
import { getArticles, type Article } from '@/api/getArticles';

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

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function addToCalendar(shiur: ShiurEvent) {
  const [day, month, year] = shiur.date.split('.');
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
}

export default function Dashboard() {
  const [nextShiur, setNextShiur] = useState<ShiurEvent | null>(null);
  const [shiurLoading, setShiurLoading] = useState(true);
  const [latestArticle, setLatestArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);

  useEffect(() => {
    getShiurim()
      .then(({ shiurim }) => {
        const now = new Date();
        const upcoming = shiurim.filter(s => s.date && !isPastShiur(s));
        setNextShiur(upcoming.length > 0 ? upcoming[0] : null);
      })
      .catch(() => {})
      .finally(() => setShiurLoading(false));

    getArticles()
      .then(({ articles }) => setLatestArticle(articles[0] ?? null))
      .catch(() => {})
      .finally(() => setArticleLoading(false));
  }, []);

  const shiurDayLabel = nextShiur?.date
    ? `יום ${dayNames[parseDate(nextShiur.date).getDay()]}`
    : null;

  return (
    <section className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl mt-6 lg:-mt-8 relative z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">

        {/* השיעור הבא */}
        <Link to={nextShiur ? `/shiurim/${nextShiur.linkId}` : '/shiurim'} className="block h-full">
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-secondary h-full cursor-pointer">
          <CardContent className="p-6 lg:p-8 h-full">
            <div className="flex flex-col items-center text-center h-full">
              <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-secondary/10 rounded-full mb-4">
                <Calendar className="h-7 w-7 lg:h-8 lg:w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-3 text-primary">השיעור הבא</h3>

              <div className="w-full flex flex-col justify-center mb-6 md:flex-1">
                {shiurLoading ? (
                  <div className="space-y-2">
                    <div className="h-5 bg-muted animate-pulse rounded mx-auto w-32" />
                    <div className="h-4 bg-muted animate-pulse rounded mx-auto w-24" />
                  </div>
                ) : nextShiur ? (
                  <div className="space-y-2" dir="rtl">
                    <p className="text-sm sm:text-base font-semibold line-clamp-2 leading-snug">{nextShiur.title}</p>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {shiurDayLabel && nextShiur.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                          {shiurDayLabel}, {nextShiur.time}
                        </span>
                      )}
                      {nextShiur.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                          <span className="truncate">{nextShiur.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">אין שיעורים קרובים</p>
                )}
              </div>

              <Button
                size="lg"
                variant="outline"
                className="w-full min-h-[44px] hover:bg-secondary hover:text-white transition-colors"
                disabled={!nextShiur || shiurLoading}
                onClick={e => { e.preventDefault(); nextShiur && addToCalendar(nextShiur); }}
              >
                הוסף ליומן
              </Button>
            </div>
          </CardContent>
        </Card>
        </Link>

        {/* מאמר אחרון */}
        <Link to={latestArticle ? `/articles/${latestArticle.linkId}` : '/articles'} className="block h-full">
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-primary h-full cursor-pointer">
          <CardContent className="p-6 lg:p-8 h-full">
            <div className="flex flex-col items-center text-center h-full">
              <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-primary/10 rounded-full mb-4">
                <BookOpen className="h-7 w-7 lg:h-8 lg:w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-3 text-primary">מאמר אחרון</h3>

              <div className="w-full flex flex-col justify-center mb-6 md:flex-1">
                {articleLoading ? (
                  <div className="space-y-2">
                    <div className="h-5 bg-muted animate-pulse rounded mx-auto w-40" />
                    <div className="h-4 bg-muted animate-pulse rounded mx-auto w-28" />
                  </div>
                ) : latestArticle ? (
                  <div className="space-y-1.5" dir="rtl">
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{latestArticle.title}</p>
                    {(latestArticle.journal || latestArticle.yeshiva) && (
                      <p className="text-xs text-muted-foreground">
                        {[latestArticle.journal, latestArticle.yeshiva].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    {latestArticle.abstract && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{latestArticle.abstract}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">אין מאמרים זמינים</p>
                )}
              </div>

              <Button
                size="lg"
                variant="outline"
                className="w-full min-h-[44px] hover:bg-primary hover:text-white transition-colors pointer-events-none"
                disabled={!latestArticle || articleLoading}
              >
                לקריאה המלאה
              </Button>
            </div>
          </CardContent>
        </Card>
        </Link>

        {/* שאל את הרב */}
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-secondary h-full sm:col-span-2 md:col-span-1">
          <CardContent className="p-6 lg:p-8 h-full">
            <div className="flex flex-col items-center text-center h-full">
              <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-secondary/20 rounded-full mb-4">
                <MessageCircle className="h-7 w-7 lg:h-8 lg:w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-3 text-primary">שאל את הרב</h3>

              <div className="flex flex-col justify-center mb-6 md:flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  קבל תשובות הלכתיות מהרב
                </p>
              </div>

              <Button size="lg" className="w-full min-h-[44px] bg-secondary text-primary hover:bg-secondary/90 transition-colors" asChild>
                <Link to="/ask">
                  שלח שאלה
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  );
}
