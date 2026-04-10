export default function FeaturedQuote() {
  return (
    <section className="bg-gradient-to-b from-muted/60 to-background py-12 sm:py-16 md:py-20 border-y border-secondary/15">
      <div className="container mx-auto px-4 max-w-3xl text-center">

        {/* Top ornament */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-secondary/60 to-transparent" />
          <div className="flex gap-1.5">
            {[1, 0.5, 0.25].map((o, i) => (
              <span
                key={i}
                className="block w-1.5 h-1.5 rounded-full bg-secondary"
                style={{ opacity: o }}
              />
            ))}
          </div>
          <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-secondary/60 to-transparent" />
        </div>

        {/* Opening mark */}
        <div className="font-serif text-6xl sm:text-7xl text-secondary/30 leading-none mb-2 select-none" aria-hidden="true">
          ״
        </div>

        {/* Quote */}
        <blockquote>
          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-primary leading-relaxed font-medium">
            תלמוד תורה כנגד כולם
          </p>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            לימוד התורה שקול כנגד כל המצוות כולן, שכן הוא המקור והיסוד לכל עשייה יהודית ולכל קיום של מצוות.
          </p>
          <footer className="mt-6 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-secondary/40" />
            <cite className="text-sm text-secondary font-semibold not-italic tracking-wide">
              הרב קלמן מאיר בר
            </cite>
            <div className="h-px w-8 bg-secondary/40" />
          </footer>
        </blockquote>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-secondary/60 to-transparent" />
          <div className="flex gap-1.5">
            {[0.25, 0.5, 1].map((o, i) => (
              <span
                key={i}
                className="block w-1.5 h-1.5 rounded-full bg-secondary"
                style={{ opacity: o }}
              />
            ))}
          </div>
          <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-secondary/60 to-transparent" />
        </div>

      </div>
    </section>
  );
}
