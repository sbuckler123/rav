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
      <HeroSection />
      <FadeIn delay={0}>
        <Dashboard />
      </FadeIn>
      <FadeIn delay={0}>
        <VideosSection />
      </FadeIn>
      <FadeIn delay={0}>
        <EventsSection />
      </FadeIn>
      <FadeIn delay={0}>
        <EventsHomeSection />
      </FadeIn>
      <FadeIn delay={0}>
        <ArticlesSection />
      </FadeIn>
    </div>
  );
}
