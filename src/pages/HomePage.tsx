import SEO from '@/components/SEO';
import HeroSection from '@/components/home/HeroSection';
import Dashboard from '@/components/home/Dashboard';
import VideosSection from '@/components/home/VideosSection';
import AskRabbiSection from '@/components/home/AskRabbiSection';
import ArticlesSection from '@/components/home/ArticlesSection';
import EventsSection from '@/components/home/EventsSection';
import EventsHomeSection from '@/components/home/EventsHomeSection';
import FadeIn from '@/components/FadeIn';

export default function HomePage() {
  return (
    <div>
      <SEO
        title="הרב קלמן מאיר בר"
        description="האתר הרשמי של הרב קלמן מאיר בר, הרב הראשי לישראל. שאלות ותשובות, שיעורי תורה, פסקי הלכה ואירועים."
      />
      <HeroSection />
      <Dashboard />
      <FadeIn>
        <VideosSection />
      </FadeIn>
      <FadeIn>
        <EventsSection />
      </FadeIn>
      <FadeIn>
        <EventsHomeSection />
      </FadeIn>
      <FadeIn>
        <ArticlesSection />
      </FadeIn>
      <FadeIn>
        <AskRabbiSection />
      </FadeIn>
    </div>
  );
}
