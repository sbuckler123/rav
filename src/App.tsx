import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import VideosPage from '@/pages/VideosPage';
import EventsPage from '@/pages/EventsPage';
import ShiurimPage from '@/pages/ShiurimPage';
import AskPage from '@/pages/AskPage';
import ArticlesPage from '@/pages/ArticlesPage';
import VideoDetailPage from '@/pages/VideoDetailPage';
import ShiurDetailPage from '@/pages/ShiurDetailPage';
import EventDetailPage from '@/pages/EventDetailPage';
import ArticleDetailPage from '@/pages/ArticleDetailPage';
import { Toaster } from '@/components/ui/sonner';
import AccessibilityWidget from '@/components/AccessibilityWidget';

// Admin
import { AuthProvider } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import LoginPage from '@/pages/admin/LoginPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import QuestionsPage from '@/pages/admin/QuestionsPage';
import QuestionDetailPage from '@/pages/admin/QuestionDetailPage';
import CategoriesPage from '@/pages/admin/CategoriesPage';
import AdminShiurimPage from '@/pages/admin/AdminShiurimPage';
import AdminVideosPage from '@/pages/admin/AdminVideosPage';
import AdminEventsPage from '@/pages/admin/AdminEventsPage';
import AdminArticlesPage from '@/pages/admin/AdminArticlesPage';
import ArticleFormPage from '@/pages/admin/ArticleFormPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>

          {/* Admin routes — no public Header/Footer */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/questions" element={<QuestionsPage />} />
                    <Route path="/questions/:id" element={<QuestionDetailPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/shiurim" element={<AdminShiurimPage />} />
                    <Route path="/videos" element={<AdminVideosPage />} />
                    <Route path="/events" element={<AdminEventsPage />} />
                    <Route path="/articles" element={<AdminArticlesPage />} />
                    <Route path="/articles/new" element={<ArticleFormPage />} />
                    <Route path="/articles/:id/edit" element={<ArticleFormPage />} />
                    <Route path="/users" element={<AdminUsersPage />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Public routes */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen flex flex-col" dir="rtl">
                <Header />
                <AccessibilityWidget />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/videos" element={<VideosPage />} />
                    <Route path="/videos/:id" element={<VideoDetailPage />} />
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
              </div>
            }
          />

        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}
