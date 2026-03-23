import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import VideosPage from '@/pages/VideosPage';
import HalachaPage from '@/pages/HalachaPage';
import EventsPage from '@/pages/EventsPage';
import ShiurimPage from '@/pages/ShiurimPage';
import AskPage from '@/pages/AskPage';
import ArticlesPage from '@/pages/ArticlesPage';
import VideoDetailPage from '@/pages/VideoDetailPage';
import ShiurDetailPage from '@/pages/ShiurDetailPage';
import HalachaDetailPage from '@/pages/HalachaDetailPage';
import EventDetailPage from '@/pages/EventDetailPage';
import ArticleDetailPage from '@/pages/ArticleDetailPage';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col" dir="rtl">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/videos/:id" element={<VideoDetailPage />} />
            <Route path="/halacha" element={<HalachaPage />} />
            <Route path="/halacha/:id" element={<HalachaDetailPage />} />
            <Route path="/shiurim" element={<ShiurimPage />} />
            <Route path="/shiurim/:id" element={<ShiurDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/ask" element={<AskPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:id" element={<ArticleDetailPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}
