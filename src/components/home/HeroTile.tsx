import { Link } from 'react-router-dom';
import { ChevronLeft, type LucideIcon } from 'lucide-react';

interface HeroTileProps {
  label: string;
  title?: string;
  to: string;
  icon: LucideIcon;
  loading?: boolean;
}

export default function HeroTile({ label, title, to, icon: Icon, loading }: HeroTileProps) {
  const ariaLabel = title ? `${label} — ${title}` : label;

  return (
    <Link
      to={to}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={ariaLabel}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-secondary to-secondary/85 border border-secondary/30 shadow-md min-h-[120px] sm:min-h-[150px] p-4 sm:p-5 text-primary transition-all duration-200 hover:from-secondary hover:to-secondary hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Icon — top start (right in RTL) */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden="true" strokeWidth={2.25} />
        </div>
      </div>

      {/* Text content */}
      <div className="mt-3 sm:mt-4">
        <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">
          {label}
        </div>
        {loading ? (
          <div className="space-y-1.5" aria-hidden="true">
            <div className="h-3.5 sm:h-4 rounded bg-primary/15 w-11/12 animate-pulse" />
            <div className="h-3.5 sm:h-4 rounded bg-primary/15 w-2/3 animate-pulse" />
          </div>
        ) : (
          title && (
            <div className="text-sm sm:text-base font-bold leading-snug line-clamp-2">
              {title}
            </div>
          )
        )}
      </div>

      {/* Arrow — bottom end (left in RTL) */}
      <ChevronLeft
        className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 h-4 w-4 text-primary/60 group-hover:text-primary group-hover:-translate-x-0.5 transition-all"
        aria-hidden="true"
      />
    </Link>
  );
}
