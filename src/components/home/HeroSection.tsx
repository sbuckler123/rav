import { Button } from '@/components/ui/button';
import { Play, Send } from 'lucide-react';
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-[#0f1e38] overflow-hidden">

      {/* Subtle radial glow behind image side */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,rgba(197,165,90,0.07),transparent)] pointer-events-none" aria-hidden="true" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl pt-6 pb-10 sm:pt-10 sm:pb-14 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">

          {/* Right column — text content */}
          <div className="text-white order-2 lg:order-1 space-y-3 sm:space-y-4" dir="rtl">

            {/* Eyebrow */}
            <p className="text-sm sm:text-base font-medium text-secondary/70 tracking-wide">
              האתר הרשמי של כבוד הרב הראשי לישראל
            </p>

            {/* Main name */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight tracking-wide">
              מרן הרב קלמן מאיר בר שליט&quot;א
            </h1>

            {/* Position title */}
            <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-serif font-semibold text-secondary leading-snug">
              נשיא מועצת הרבנות הראשית לישראל
            </h2>

            {/* Gold ornament — matches PageHeader style */}
            <div className="flex items-center gap-3 py-0.5 w-40 sm:w-64" aria-hidden="true">
              <div className="h-px flex-1 bg-gradient-to-l from-secondary/50 to-transparent" />
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-secondary/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-secondary/65" />
                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <div className="w-1.5 h-1.5 rounded-full bg-secondary/65" />
                <div className="w-1 h-1 rounded-full bg-secondary/40" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-secondary/50 to-transparent" />
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
              שאלות ותשובות, שיעורים, פסקי הלכה ואירועים
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:pt-2">
              <Button
                className="w-full sm:w-auto bg-secondary text-primary hover:bg-secondary/90 gap-2 text-sm sm:text-base px-5 py-3 min-h-[44px]"
                asChild
              >
                <Link to="/videos" className="flex items-center gap-2">
                  <Play className="h-4 w-4 shrink-0" />
                  השיעור השבועי
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2 text-sm sm:text-base px-5 py-3 min-h-[44px]"
                asChild
              >
                <Link to="/ask" className="flex items-center gap-2">
                  <Send className="h-4 w-4 shrink-0" />
                  שאל את הרב
                </Link>
              </Button>
            </div>
          </div>

          {/* Left column — image */}
          <div className="order-1 lg:order-2 relative mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-none">
            {/* Gold corner accent frame — inset on mobile to avoid container clipping */}
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-12 sm:h-12 border-t-2 border-r-2 border-secondary/60 rounded-tr-xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-10 h-10 sm:w-12 sm:h-12 border-b-2 border-l-2 border-secondary/60 rounded-bl-xl pointer-events-none" aria-hidden="true" />
            <div className="relative rounded-xl overflow-hidden ring-1 ring-secondary/20 shadow-2xl">
              <img
                src="/og-image.jpg"
                alt="הרב קלמן מאיר בר"
                className="w-full object-cover object-top max-h-[260px] sm:max-h-[340px] lg:max-h-[420px]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
