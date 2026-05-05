import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProvider } from '@clerk/clerk-react';
import { heIL } from '@clerk/localizations';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
});

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
import QAPage from '@/pages/QAPage';
import ArticlesPage from '@/pages/ArticlesPage';
import VideoDetailPage from '@/pages/VideoDetailPage';
import ShiurDetailPage from '@/pages/ShiurDetailPage';
import EventDetailPage from '@/pages/EventDetailPage';
import ArticleDetailPage from '@/pages/ArticleDetailPage';
import { Toaster } from '@/components/ui/sonner';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import CookieBanner from '@/components/CookieBanner';
import ErrorBoundary from '@/components/ErrorBoundary';

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
import AdminAlHaperekPage from '@/pages/admin/AdminAlHaperekPage';
import AlHaperekFormPage from '@/pages/admin/AlHaperekFormPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AlHaperekPage from '@/pages/AlHaperekPage';
import AlHaperekDetailPage from '@/pages/AlHaperekDetailPage';
import AccessibilityStatementPage from '@/pages/AccessibilityStatementPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import CookiePolicyPage from '@/pages/CookiePolicyPage';
import TermsPage from '@/pages/TermsPage';

export default function App() {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

  return (
    <QueryClientProvider client={queryClient}>
    <HelmetProvider>
    <ClerkProvider publishableKey={clerkKey} localization={{ ...heIL, signIn: { ...heIL.signIn, start: { ...heIL.signIn?.start, subtitle: '' } } }}>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>

          {/* Admin routes — no public Header/Footer */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/*"
            element={
              <ErrorBoundary>
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
                    <Route path="/al-haperek" element={<AdminAlHaperekPage />} />
                    <Route path="/al-haperek/new" element={<AlHaperekFormPage />} />
                    <Route path="/al-haperek/:id/edit" element={<AlHaperekFormPage />} />
                    <Route path="/users" element={<AdminUsersPage />} />
                    <Route path="/settings" element={<AdminSettingsPage />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
              </ErrorBoundary>
            }
          />

          {/* Public routes */}
          <Route
            path="/*"
            element={
              <ErrorBoundary>
              <div className="min-h-screen flex flex-col" dir="rtl">
                <Header />
                <AccessibilityWidget />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/odot" element={<AboutPage />} />
                    <Route path="/shiurei-torah" element={<VideosPage />} />
                    <Route path="/shiurei-torah/:id" element={<VideoDetailPage />} />
                    <Route path="/luach-iruyim" element={<ShiurimPage />} />
                    <Route path="/luach-iruyim/:id" element={<ShiurDetailPage />} />
                    <Route path="/yoman-peilut" element={<EventsPage />} />
                    <Route path="/yoman-peilut/:id" element={<EventDetailPage />} />
                    <Route path="/shaal-et-harav" element={<AskPage />} />
                    <Route path="/shut" element={<QAPage />} />
                    <Route path="/hagut-upsika" element={<ArticlesPage />} />
                    <Route path="/hagut-upsika/:id" element={<ArticleDetailPage />} />
                    <Route path="/al-haperek" element={<AlHaperekPage />} />
                    <Route path="/al-haperek/:id" element={<AlHaperekDetailPage />} />
                    <Route path="/accessibility" element={<AccessibilityStatementPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/cookies" element={<CookiePolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
              </ErrorBoundary>
            }
          />

        </Routes>
        <CookieBanner />
        <Toaster />
      </Router>
    </AuthProvider>
    </ClerkProvider>
    </HelmetProvider>
    </QueryClientProvider>
  );
}
