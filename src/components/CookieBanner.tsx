import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Check } from 'lucide-react';

const STORAGE_KEY = 'cookie-consent';

type ConsentStatus = 'accepted' | 'declined';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const acceptBtnRef = useRef<HTMLButtonElement>(null);

  // Show banner only if no prior decision is stored
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  // Auto-focus the accept button when banner appears
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => acceptBtnRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [visible]);

  function save(status: ConsentStatus) {
    localStorage.setItem(STORAGE_KEY, status);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="הסכמה לשימוש בעוגיות"
      dir="rtl"
      className="fixed bottom-0 inset-x-0 z-[9998] bg-primary text-primary-foreground shadow-[0_-4px_24px_rgba(0,0,0,0.18)]"
    >
      {/* Thin gold accent line at top */}
      <div className="h-0.5 w-full bg-secondary" aria-hidden="true" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Icon + text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Cookie className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-secondary mb-0.5">עוגיות ואחסון מקומי</p>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                אנו משתמשים בעוגיות לשמירת הגדרות הנגישות שלכם ולשיפור חוויית הגלישה.{' '}
                <Link
                  to="/cookies"
                  className="underline underline-offset-2 text-secondary hover:text-secondary/80 transition-colors font-medium whitespace-nowrap"
                >
                  מדיניות העוגיות
                </Link>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => save('declined')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary min-h-[44px]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              דחה
            </button>

            <button
              ref={acceptBtnRef}
              onClick={() => save('accepted')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-secondary/90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white shadow-sm min-h-[44px]"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              אני מסכים/ה
            </button>

            {/* Close / dismiss */}
            <button
              onClick={() => save('declined')}
              aria-label="סגור"
              className="hidden sm:flex items-center justify-center rounded-lg p-2 opacity-60 hover:opacity-100 hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
