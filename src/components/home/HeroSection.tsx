export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-[#0f1e38] overflow-hidden">

      {/* Subtle radial glow behind image side */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,rgba(197,165,90,0.07),transparent)] pointer-events-none" aria-hidden="true" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 sm:py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">

          {/* Right column — text content */}
          <div className="text-white order-2 lg:order-1 space-y-4 sm:space-y-5 text-center lg:text-right" dir="rtl">

            {/* Main name */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight tracking-wide">
              הרב קלמן מאיר בר
            </h1>

            {/* Position title */}
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif font-semibold text-secondary leading-snug">
              הרב הראשי לישראל נשיא מועצת הרבנות הראשית
            </h2>

            {/* Gold ornament */}
            <div className="flex items-center gap-3 py-1 w-48 sm:w-64 mx-auto lg:mx-0" aria-hidden="true">
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
            <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed max-w-lg mx-auto lg:mx-0">
              שאלות ותשובות, שיעורים, פסקי הלכה ואירועים
            </p>
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
                className="w-full object-cover object-top max-h-[260px] sm:max-h-[340px] lg:max-h-[460px]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
