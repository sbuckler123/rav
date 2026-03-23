import HeroSection from '@/components/home/HeroSection';
import Dashboard from '@/components/home/Dashboard';
import VideosSection from '@/components/home/VideosSection';
import AskRabbiSection from '@/components/home/AskRabbiSection';
import ArticlesSection from '@/components/home/ArticlesSection';
import EventsSection from '@/components/home/EventsSection';
import EventsHomeSection from '@/components/home/EventsHomeSection';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <Dashboard />
      <VideosSection />
      <EventsSection />
      <EventsHomeSection />
      <ArticlesSection />
    </div>
  );
}
