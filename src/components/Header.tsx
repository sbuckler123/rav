import { Menu, X, Mail, Send, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import NewsletterDialog from '@/components/NewsletterDialog';
import { getVideos } from '@/api/getVideos';

const navLinks = [
  { href: '/ask', label: 'שאל את הרב' },
  { href: '/videos', label: 'שיעורי וידאו' },
  { href: '/shiurim', label: 'לוח שיעורים' },
  { href: '/events', label: 'אירועים' },
  { href: '/articles', label: 'מאמרים ופסקי הלכה' },
  { href: '/about', label: 'אודות' },
];

let latestShiurCache: string | null = null;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [latestShiurId, setLatestShiurId] = useState<string | null>(latestShiurCache);
  const location = useLocation();

  useEffect(() => {
    if (latestShiurCache) return;
    getVideos()
      .then(({ shiurim }) => {
        const latest = shiurim.find((v) => v.isNew) ?? shiurim[0];
        if (latest?.linkId) {
          latestShiurCache = latest.linkId;
          setLatestShiurId(latest.linkId);
        }
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const closeMobileMenu = () => { setIsMenuOpen(false); scrollTop(); };
  const latestShiurHref = latestShiurId ? `/videos/${latestShiurId}` : '/videos';

  return (
    <>
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg" role="banner">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

          {/* Row 1: Logo (right) + CTAs (left, desktop) / hamburger (left, mobile) */}
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 min-w-0"
              aria-label="דף הבית - הרב קלמן מאיר בר"
              onClick={scrollTop}
            >
              <div className="bg-white rounded-full p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="לוגו הרבנות הראשית"
                  className="h-12 w-12 sm:h-14 sm:w-14 object-cover"
                />
              </div>
              <div className="text-secondary text-lg sm:text-xl md:text-2xl font-serif hidden sm:block">
                <div className="font-bold leading-tight">הרב קלמן מאיר בר</div>
                <div className="text-xs sm:text-sm font-normal opacity-90">הרב הראשי לישראל</div>
              </div>
            </Link>

            {/* Desktop CTAs (left side) */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setNewsletterOpen(true)}
                className="text-primary-foreground hover:bg-white/10 hover:text-secondary gap-2 min-h-[44px] px-3"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>הצטרפות לניוזלטר</span>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10 hover:text-secondary gap-2 min-h-[44px] px-3"
              >
                <Link to="/ask" onClick={scrollTop}>
                  <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>שאל את הרב</span>
                </Link>
              </Button>
              <Button
                asChild
                className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px] px-4"
              >
                <Link to={latestShiurHref} onClick={scrollTop}>
                  <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>השיעור האחרון</span>
                </Link>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground hover:bg-white/10 min-h-[44px] min-w-[44px]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Row 2: Desktop nav — under the logo, larger text, right-aligned */}
          <nav
            className="hidden lg:flex items-center gap-6 xl:gap-8 border-t border-white/10 py-3"
            aria-label="ניווט ראשי"
            dir="rtl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={scrollTop}
                className={`text-base xl:text-lg transition-colors relative pb-1 whitespace-nowrap ${
                  isActive(link.href)
                    ? 'text-secondary font-semibold after:absolute after:bottom-0 after:right-0 after:left-0 after:h-0.5 after:bg-secondary after:rounded-full'
                    : 'hover:text-secondary'
                }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div id="mobile-menu" className="lg:hidden pb-4 pt-1 border-t border-white/10">
              <nav aria-label="ניווט נייד">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-colors text-base min-h-[48px] ${
                      isActive(link.href)
                        ? 'text-secondary font-semibold bg-white/10'
                        : 'hover:text-secondary hover:bg-white/5'
                    }`}
                    onClick={closeMobileMenu}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                  >
                    {isActive(link.href) && (
                      <span className="w-1 h-4 bg-secondary rounded-full shrink-0" aria-hidden="true" />
                    )}
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile CTAs */}
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setNewsletterOpen(true); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-white/5 hover:text-secondary transition-colors text-base min-h-[48px] text-right"
                >
                  <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
                  הצטרפות לניוזלטר
                </button>
                <Link
                  to="/ask"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-white/5 hover:text-secondary transition-colors text-base min-h-[48px]"
                >
                  <Send className="h-5 w-5 shrink-0" aria-hidden="true" />
                  שאל את הרב
                </Link>
                <Link
                  to={latestShiurHref}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg bg-secondary text-primary hover:bg-secondary/90 transition-colors text-base font-semibold min-h-[48px]"
                >
                  <Play className="h-5 w-5 shrink-0" aria-hidden="true" />
                  השיעור האחרון
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <NewsletterDialog open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </>
  );
}
