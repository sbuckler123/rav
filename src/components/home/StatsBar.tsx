import { useEffect, useRef, useState } from 'react';

function useCountUp(target: number, duration: number, enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, enabled]);
  return count;
}

function StatItem({
  label,
  value,
  loading,
  animate,
}: {
  label: string;
  value: number;
  loading: boolean;
  animate: boolean;
}) {
  const count = useCountUp(value, 1400, animate && value > 0);
  const display = loading ? '—' : value >= 100 ? '100+' : String(count);

  return (
    <div className="flex flex-col items-center gap-1.5 px-3 sm:px-4 py-2 min-w-0">
      <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-secondary tabular-nums">
        {display}
      </span>
      <span className="text-[11px] sm:text-xs md:text-sm text-muted-foreground tracking-wide text-center leading-snug">{label}</span>
    </div>
  );
}

export default function StatsBar() {
  const [counts, setCounts] = useState({ shiurim: 0, articles: 0, videos: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setCounts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { label: 'לוח שיעורים',          value: counts.shiurim },
    { label: 'מאמרים ופסקי הלכה',    value: counts.articles },
    { label: 'שיעורי וידאו',          value: counts.videos },
    { label: 'שאלות ותשובות',         value: counts.questions },
  ];

  return (
    <div ref={ref} className="bg-background border-y border-border">
      <div className="container mx-auto px-4 max-w-7xl py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`
                ${i < 2 ? 'border-b lg:border-b-0' : ''} border-border
                ${i % 2 === 0 ? 'border-e' : ''} lg:border-e
                ${i === stats.length - 1 ? 'lg:border-e-0' : ''}
                pb-6 lg:pb-0 pt-0
                ${i >= 2 ? 'pt-6 lg:pt-0' : ''}
              `}
            >
              <StatItem label={s.label} value={s.value} loading={loading} animate={animate} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
