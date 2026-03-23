import { Button } from '@/components/ui/button';
import { Play, Send } from 'lucide-react';
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative bg-primary overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl pt-10 pb-14 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Right column — text content */}
          <div className="text-white order-2 lg:order-1 space-y-4" dir="rtl">

            {/* Eyebrow */}
            <p className="text-lg md:text-2xl font-medium text-secondary/80 tracking-wide">
              האתר הרשמי של כבוד הרב הראשי לישראל
            </p>

            {/* Main name */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              מרן הרב קלמן מאיר בר שליט&quot;א
            </h1>

            {/* Title */}
            <h2 className="text-xl md:text-3xl lg:text-4xl font-semibold text-secondary leading-snug">
              נשיא מועצת הרבנות הראשית לישראל
            </h2>

            {/* Subtle divider */}
            <div className="flex items-center gap-2 py-1">
              <div className="w-6 h-px bg-secondary/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-secondary/60"></div>
              <div className="w-12 h-px bg-secondary/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-secondary/60"></div>
              <div className="w-6 h-px bg-secondary/50"></div>
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              שאלות ותשובות, שיעורים, פסקי הלכה ואירועים
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 gap-2 text-sm sm:text-base px-5 py-3 min-h-[44px]"
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
          <div className="order-1 lg:order-2 relative">
            <div className="absolute -inset-4 bg-secondary/20 rounded-xl blur-2xl pointer-events-none"></div>
            <div className="relative rounded-xl overflow-hidden">
              <img
                src="https://images.fillout.com/orgid-590181/flowpublicid-bjqtmvgzna/widgetid-default/fbWdZYpc2d4y4e6G4p1wmf/pasted-image-1770841682409.jpg"
                alt="הרב קלמן מאיר בר"
                className="rounded-xl shadow-2xl w-full h-auto object-contain lg:object-cover lg:max-h-[420px]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
