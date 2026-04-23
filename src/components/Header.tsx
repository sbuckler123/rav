import { Menu, X, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import NewsletterDialog from '@/components/NewsletterDialog';
import { NAV_LINKS as navLinks } from '@/config/nav';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const closeMobileMenu = () => { setIsMenuOpen(false); scrollTop(); };

  return (
    <>
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg" role="banner">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

          {/* Row 1: Logo (right) + CTAs (left, desktop) / hamburger (mobile) */}
          <div className="relative flex items-center justify-between h-16 sm:h-20">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 min-w-0 relative z-10"
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
              {/* Desktop only — shown when full nav is active */}
              <div className="text-secondary text-lg xl:text-2xl font-serif hidden lg:block">
                <div className="font-bold leading-tight">הרב קלמן מאיר בר</div>
                <div className="text-xs xl:text-sm font-normal opacity-90">הרב הראשי לישראל</div>
                <div className="text-xs xl:text-sm font-normal opacity-75">נשיא מועצת הרבנות הראשית</div>
              </div>
            </Link>

            {/* Mobile/tablet centered title — shown when hamburger is active */}
            <div className="lg:hidden absolute inset-x-0 flex justify-center pointer-events-none" aria-hidden="true">
              <div className="text-center font-serif pointer-events-auto">
                <div className="text-xs sm:text-sm font-bold text-secondary leading-tight">הרב קלמן מאיר בר</div>
                <div className="text-[10px] sm:text-xs text-secondary/90 leading-snug">הרב הראשי לישראל</div>
                <div className="text-[10px] sm:text-xs text-secondary/75 leading-snug">נשיא מועצת הרבנות הראשית</div>
              </div>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewsletterOpen(true)}
                className="inline-flex items-center gap-2 rounded-md px-3 min-h-[44px] text-sm font-medium whitespace-nowrap text-primary-foreground hover:bg-white/10 hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="leading-none">הצטרפות לניוזלטר</span>
              </button>
              <Link
                to="/shaal-et-harav"
                onClick={scrollTop}
                className="inline-flex items-center gap-2 rounded-md px-4 min-h-[44px] text-sm font-semibold whitespace-nowrap bg-secondary text-primary hover:bg-secondary/90 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="leading-none">שאל את הרב</span>
              </Link>
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

          {/* Row 2: Desktop nav */}
          <nav
            className="hidden lg:flex items-center gap-4 xl:gap-7 border-t border-white/10 py-3"
            aria-label="ניווט ראשי"
            dir="rtl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={scrollTop}
                className={`group relative text-base xl:text-lg transition-colors pb-1 whitespace-nowrap ${
                  isActive(link.href)
                    ? 'text-secondary font-semibold after:absolute after:bottom-0 after:right-0 after:left-0 after:h-0.5 after:bg-secondary after:rounded-full'
                    : 'hover:text-secondary'
                }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
                {link.desc && (
                  <span
                    role="tooltip"
                    aria-hidden="true"
                    className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-xl bg-primary border border-secondary/25 text-primary-foreground/80 text-xs leading-relaxed px-3 pt-3.5 pb-3 shadow-2xl shadow-black/40 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 text-right z-50 whitespace-normal font-normal overflow-hidden"
                  >
                    {/* Gold top accent — matches PageHeader ornament style */}
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-secondary/70 to-transparent"
                    />
                    {/* Arrow caret */}
                    <span
                      aria-hidden="true"
                      className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-primary border-t border-l border-secondary/25 rotate-45"
                    />
                    {link.desc}
                  </span>
                )}
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
                    className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-colors min-h-[56px] ${
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
                    <span className="flex flex-col min-w-0">
                      <span className="text-base leading-tight">{link.label}</span>
                      {link.desc && (
                        <span className="text-xs text-secondary/70 font-normal leading-snug mt-0.5">{link.desc}</span>
                      )}
                    </span>
                  </Link>
                ))}
              </nav>

              {/* Mobile CTAs */}
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                <Link
                  to="/shaal-et-harav"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg bg-secondary text-primary hover:bg-secondary/90 transition-colors text-base font-semibold min-h-[48px]"
                >
                  <Send className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="leading-none">שאל את הרב</span>
                </Link>
                <button
                  type="button"
                  onClick={() => { setNewsletterOpen(true); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-white/5 hover:text-secondary transition-colors text-base min-h-[48px] w-full text-right"
                >
                  <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="leading-none">הצטרפות לניוזלטר</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <NewsletterDialog open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </>
  );
}
