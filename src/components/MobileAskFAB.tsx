import { Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileAskFAB() {
  const { pathname } = useLocation();

  // Hide on the ask page itself and in admin
  if (pathname === '/shaal-et-harav' || pathname.startsWith('/admin')) return null;

  return (
    <div
      className="lg:hidden fixed bottom-5 right-4 z-40 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 motion-safe:duration-300"
      aria-label="שאל את הרב — כפתור פעולה מהיר"
    >
      <Link
        to="/shaal-et-harav"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="שאל את הרב"
        className="flex items-center gap-2 bg-secondary text-primary font-bold text-sm rounded-full shadow-lg shadow-black/25 px-5 py-3.5 min-h-[52px] transition-all duration-200 hover:bg-secondary/90 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="leading-none">שאל את הרב</span>
      </Link>
    </div>
  );
}
