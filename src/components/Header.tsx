import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { href: '/ask', label: 'שאל את הרב' },
    { href: '/videos', label: 'שיעורי וידאו' },
    { href: '/shiurim', label: 'לוח שיעורים' },
    { href: '/events', label: 'אירועים' },
    { href: '/articles', label: 'מאמרים ופסקי הלכה' },
    { href: '/about', label: 'אודות' },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg" role="banner">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="דף הבית - הרב קלמן מאיר בר" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-white rounded-full p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="https://images.fillout.com/orgid-590181/flowpublicid-faiasrbeba/widgetid-default/da4RdkwRZDxv5w1uPJeYYk/pasted-image-1771332416037.png"
                alt="לוגו הרבנות הראשית"
                className="h-12 w-12 sm:h-14 sm:w-14 object-cover"
              />
            </div>
            <div className="text-secondary text-lg sm:text-xl md:text-2xl font-serif hidden sm:block">
              <div className="font-bold leading-tight">הרב קלמן מאיר בר</div>
              <div className="text-xs sm:text-sm font-normal opacity-90">הרב הראשי לישראל</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6" aria-label="ניווט ראשי">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`text-sm transition-colors relative pb-1 whitespace-nowrap ${
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

        {/* Mobile menu */}
        {isMenuOpen && (
          <nav id="mobile-menu" className="lg:hidden pb-4 pt-1 border-t border-white/10" aria-label="ניווט נייד">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-colors text-base min-h-[48px] ${
                  isActive(link.href)
                    ? 'text-secondary font-semibold bg-white/10'
                    : 'hover:text-secondary hover:bg-white/5'
                }`}
                onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {isActive(link.href) && (
                  <span className="w-1 h-4 bg-secondary rounded-full shrink-0" aria-hidden="true" />
                )}
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
