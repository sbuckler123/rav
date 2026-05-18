import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProvider } from '@clerk/clerk-react';
import { heIL } from '@clerk/localizations';
import { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazyWithRetry as lazy } from '@/lib/lazyWithRetry';

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

// Eager: needed for first paint or appears on every route
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import { Toaster } from '@/components/ui/sonner';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import CookieBanner from '@/components/CookieBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

// Lazy: every other page is loaded only when its route is visited
const AboutPage                   = lazy(() => import('@/pages/AboutPage'));
const VideosPage                  = lazy(() => import('@/pages/VideosPage'));
const ShiurimPage                 = lazy(() => import('@/pages/ShiurimPage'));
const AskPage                     = lazy(() => import('@/pages/AskPage'));
const QAPage                      = lazy(() => import('@/pages/QAPage'));
const ArticlesPage                = lazy(() => import('@/pages/ArticlesPage'));
const VideoDetailPage             = lazy(() => import('@/pages/VideoDetailPage'));
const ShiurDetailPage             = lazy(() => import('@/pages/ShiurDetailPage'));
const ArticleDetailPage           = lazy(() => import('@/pages/ArticleDetailPage'));
const AlHaperekPage               = lazy(() => import('@/pages/AlHaperekPage'));
const AlHaperekDetailPage         = lazy(() => import('@/pages/AlHaperekDetailPage'));
const AccessibilityStatementPage  = lazy(() => import('@/pages/AccessibilityStatementPage'));
const PrivacyPolicyPage           = lazy(() => import('@/pages/PrivacyPolicyPage'));
const CookiePolicyPage            = lazy(() => import('@/pages/CookiePolicyPage'));
const TermsPage                   = lazy(() => import('@/pages/TermsPage'));

const AdminLayout         = lazy(() => import('@/components/admin/AdminLayout'));
const LoginPage           = lazy(() => import('@/pages/admin/LoginPage'));
const AdminDashboard      = lazy(() => import('@/pages/admin/AdminDashboard'));
const QuestionsPage       = lazy(() => import('@/pages/admin/QuestionsPage'));
const QuestionDetailPage  = lazy(() => import('@/pages/admin/QuestionDetailPage'));
const CategoriesPage      = lazy(() => import('@/pages/admin/CategoriesPage'));
const AdminShiurimPage    = lazy(() => import('@/pages/admin/AdminShiurimPage'));
const AdminVideosPage     = lazy(() => import('@/pages/admin/AdminVideosPage'));
const AdminEventsPage     = lazy(() => import('@/pages/admin/AdminEventsPage'));
const AdminArticlesPage   = lazy(() => import('@/pages/admin/AdminArticlesPage'));
const ArticleFormPage     = lazy(() => import('@/pages/admin/ArticleFormPage'));
const AdminAlHaperekPage  = lazy(() => import('@/pages/admin/AdminAlHaperekPage'));
const AlHaperekFormPage   = lazy(() => import('@/pages/admin/AlHaperekFormPage'));
const AdminUsersPage      = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminSettingsPage   = lazy(() => import('@/pages/admin/AdminSettingsPage'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24" aria-busy="true" aria-label="טוען">
      <div className="h-6 w-6 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
    </div>
  );
}

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
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<RouteFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ErrorBoundary>
              <ProtectedRoute>
                <Suspense fallback={<RouteFallback />}>
                  <AdminLayout>
                    <Suspense fallback={<RouteFallback />}>
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
                        <Route path="/idkunim" element={<AdminAlHaperekPage />} />
                        <Route path="/idkunim/new" element={<AlHaperekFormPage />} />
                        <Route path="/idkunim/:id/edit" element={<AlHaperekFormPage />} />
                        <Route path="/users" element={<AdminUsersPage />} />
                        <Route path="/settings" element={<AdminSettingsPage />} />
                      </Routes>
                    </Suspense>
                  </AdminLayout>
                </Suspense>
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
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/odot" element={<AboutPage />} />
                      <Route path="/shiurei-torah" element={<VideosPage />} />
                      <Route path="/shiurei-torah/:id" element={<VideoDetailPage />} />
                      <Route path="/luach-iruyim" element={<ShiurimPage />} />
                      <Route path="/luach-iruyim/:id" element={<ShiurDetailPage />} />
                      <Route path="/shaal-et-harav" element={<AskPage />} />
                      <Route path="/shut" element={<QAPage />} />
                      <Route path="/hagut-upsika" element={<ArticlesPage />} />
                      <Route path="/hagut-upsika/:id" element={<ArticleDetailPage />} />
                      <Route path="/idkunim" element={<AlHaperekPage />} />
                      <Route path="/idkunim/:id" element={<AlHaperekDetailPage />} />
                      <Route path="/accessibility" element={<AccessibilityStatementPage />} />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />
                      <Route path="/cookies" element={<CookiePolicyPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                    </Routes>
                  </Suspense>
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
