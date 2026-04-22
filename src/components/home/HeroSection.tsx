import { useEffect, useState } from 'react';
import { Play, FileText, MessageCircle, Calendar } from 'lucide-react';
import HeroTile from './HeroTile';
import { getVideos, type ShiurItem } from '@/api/getVideos';
import { getArticles, type Article } from '@/api/getArticles';
import { getEvents, type EventItem } from '@/api/getEvents';
import { getPublishedQuestions } from '@/api/getPublishedQuestions';

type Question = Awaited<ReturnType<typeof getPublishedQuestions>>['questions'][number];

function pickLatestVideo(videos: ShiurItem[]): ShiurItem | null {
  if (!videos.length) return null;
  return videos.find((v) => v.isNew) ?? videos[0];
}

function pickNextEvent(events: EventItem[]): EventItem | null {
  if (!events.length) return null;
  const now = new Date();
  const upcoming = events
    .filter((e) => {
      if (!e.dateLocale) return false;
      const d = new Date(e.dateLocale);
      return !isNaN(d.getTime()) && d >= now;
    })
    .sort((a, b) => new Date(a.dateLocale).getTime() - new Date(b.dateLocale).getTime());
  return upcoming[0] ?? events[0];
}

function pickLatestAnswered(questions: Question[]): Question | null {
  const answered = questions.filter((q) => q.answers.length > 0);
  if (!answered.length) return null;
  return answered.sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  })[0];
}

export default function HeroSection() {
  const [video, setVideo] = useState<ShiurItem | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [latestQA, setLatestQA] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getVideos(),
      getArticles(),
      getEvents(),
      getPublishedQuestions({}),
    ]).then((results) => {
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setVideo(pickLatestVideo(results[0].value.shiurim));
      if (results[1].status === 'fulfilled') setArticle(results[1].value.articles[0] ?? null);
      if (results[2].status === 'fulfilled') setEvent(pickNextEvent(results[2].value.events));
      if (results[3].status === 'fulfilled') setLatestQA(pickLatestAnswered(results[3].value.questions));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const videoHref = video?.linkId ? `/videos/${video.linkId}` : '/videos';
  const articleHref = article?.linkId ? `/articles/${article.linkId}` : '/articles';
  const eventHref = event?.linkId ? `/events/${event.linkId}` : '/events';
  const qaHref = latestQA?.id ? `/qa#q-${latestQA.id}` : '/qa';

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-[#0f1e38] overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(197,165,90,0.07),transparent)] pointer-events-none" aria-hidden="true" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-6 sm:py-10 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">

          {/* Right column — image (first source child; RTL puts it on the right) */}
          <div className="relative mx-auto w-full max-w-[220px] sm:max-w-xs lg:max-w-none">
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-12 sm:h-12 border-t-2 border-r-2 border-secondary/60 rounded-tr-xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-10 h-10 sm:w-12 sm:h-12 border-b-2 border-l-2 border-secondary/60 rounded-bl-xl pointer-events-none" aria-hidden="true" />
            <div className="relative rounded-xl overflow-hidden ring-1 ring-secondary/20 shadow-2xl">
              <img
                src="/og-image.jpg"
                alt="הרב קלמן מאיר בר"
                className="w-full object-cover object-top max-h-[200px] sm:max-h-[280px] lg:max-h-[440px]"
              />
            </div>
          </div>

          {/* Left column — 2×2 tile grid + identity line */}
          <div className="flex flex-col gap-4 sm:gap-5" dir="rtl">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <HeroTile
                label="שיעור אחרון"
                title={video?.title}
                to={videoHref}
                icon={Play}
                loading={loading}
              />
              <HeroTile
                label="מאמר אחרון"
                title={article?.title}
                to={articleHref}
                icon={FileText}
                loading={loading}
              />
              <HeroTile
                label="תשובה אחרונה"
                title={latestQA?.questionContent}
                to={qaHref}
                icon={MessageCircle}
                loading={loading}
              />
              <HeroTile
                label="אירוע אחרון"
                title={event?.title}
                to={eventHref}
                icon={Calendar}
                loading={loading}
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
