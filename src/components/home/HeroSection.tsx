import { Play, FileText, MessageCircle, Calendar, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroTile from './HeroTile';
import { type ShiurItem } from '@/api/getVideos';
import { type Article } from '@/api/getArticles';
import { type EventItem } from '@/api/getEvents';
import { type getPublishedQuestions } from '@/api/getPublishedQuestions';
import { useArticles, useVideos, useEvents, useQuestions } from '@/hooks/useQueries';

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

function latestAnswerTitle(question: Question | null): string | undefined {
  if (!question) return undefined;
  const sorted = [...question.answers].sort((a, b) =>
    (a.date ?? '').localeCompare(b.date ?? ''),
  );
  const latest = sorted[sorted.length - 1];
  return latest?.title?.trim() || question.questionContent || undefined;
}

export default function HeroSection() {
  const { data: videosData, isLoading: videosLoading } = useVideos();
  const { data: articlesData, isLoading: articlesLoading } = useArticles();
  const { data: eventsData, isLoading: eventsLoading } = useEvents();
  const { data: questionsData, isLoading: questionsLoading } = useQuestions();

  const loading = videosLoading || articlesLoading || eventsLoading || questionsLoading;

  const video = videosData ? pickLatestVideo(videosData.shiurim) : null;
  const article = articlesData?.articles[0] ?? null;
  const event = eventsData ? pickNextEvent(eventsData.events) : null;
  const latestQA = questionsData ? pickLatestAnswered(questionsData.questions) : null;

  const videoHref = video?.linkId ? `/shiurei-torah/${video.linkId}` : '/shiurei-torah';
  const articleHref = article?.linkId ? `/hagut-upsika/${article.linkId}` : '/hagut-upsika';
  const eventHref = event?.linkId ? `/yoman-peilut/${event.linkId}` : '/yoman-peilut';
  const qaHref = latestQA?.id ? `/shut#q-${latestQA.id}` : '/shut';

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-[#0f1e38] overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(197,165,90,0.07),transparent)] pointer-events-none" aria-hidden="true" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-6 sm:py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6 sm:gap-8 lg:gap-10 items-stretch">

          {/* Right column — image (RTL puts it on the right); 1/3 width on desktop */}
          <div className="relative mx-auto w-full max-w-[220px] sm:max-w-xs lg:max-w-none lg:h-full">
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-12 sm:h-12 border-t-2 border-r-2 border-secondary/60 rounded-tr-xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-10 h-10 sm:w-12 sm:h-12 border-b-2 border-l-2 border-secondary/60 rounded-bl-xl pointer-events-none" aria-hidden="true" />
            <div className="relative rounded-xl overflow-hidden ring-1 ring-secondary/20 shadow-2xl lg:h-full">
              <img
                src="/og-image.jpg"
                alt="הרב קלמן מאיר בר"
                className="w-full object-cover object-top max-h-[200px] sm:max-h-[280px] lg:max-h-none lg:h-full"
              />
            </div>
          </div>

          {/* Left column — 2×2 tile grid; 2/3 width on desktop */}
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
                title={latestAnswerTitle(latestQA)}
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

            <Link
              to="/shaal-et-harav"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="lg:hidden flex items-center justify-center gap-2.5 w-full bg-secondary text-primary rounded-xl px-6 py-4 text-base sm:text-lg font-bold shadow-lg hover:bg-secondary/90 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <Send className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>שאל את הרב</span>
            </Link>

          </div>

        </div>
      </div>
    </section>
  );
}
