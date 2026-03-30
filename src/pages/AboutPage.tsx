import SEO from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="אודות הרב קלמן מאיר בר"
        description='היכרות עם הגאון הרב קלמן מאיר בר שליט"א, הרב הראשי לישראל ונשיא מועצת הרבנות הראשית לישראל.'
      />
      <PageHeader
        title='הגאון הרב קלמן מאיר בר שליט"א'
        subtitle="הרב הראשי לישראל ונשיא מועצת הרבנות הראשית לישראל"
        breadcrumbs={[{ label: 'דף הבית', href: '/' }, { label: 'אודות' }]}
      />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">

        {/* Biography */}
        <section className="grid md:grid-cols-5 gap-10 mb-16" aria-label="ביוגרפיה">
          <div className="md:col-span-2">
            <Card className="overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src="https://images.fillout.com/orgid-590181/flowpublicid-bjqtmvgzna/widgetid-default/dsJ7nCmUnT3GwzCJGP8zrj/pasted-image-1770841861394.jpg"
                    alt="הרב קלמן מאיר בר שליטא"
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3 space-y-8">
            <Card className="border-t-4 border-t-secondary shadow-lg bg-[#FAF8F2]">
              <CardContent className="p-6 sm:p-8">
                <p className="text-base sm:text-lg leading-relaxed text-foreground mb-6">
                  הגאון הרב קלמן מאיר בר שליט"א ניצב בחזית ההנהגה הרוחנית של מדינת ישראל, כשדמותו משלבת גדלות בתורה עם מאור פנים נדיר ואהבת ישראל עמוקה.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-foreground mb-6">
                  לאחר עשורים של הרבצת תורה כר"מ בישיבת "כרם ביבנה" וכהונה מסורה כרבה הראשי של העיר נתניה, נבחר הרב להוביל את הרבנות הראשית בדרכי נועם ובחכמה. הרב ידוע כפוסק הלכה המחובר לאתגרי השעה, כמחבר ספרי הגות ותורה, וכמנהיג המהווה גשר מאחד בין כל חלקי העם.
                </p>
                <div className="pt-6 border-t border-secondary/20">
                  <p className="text-base sm:text-lg leading-relaxed text-muted-foreground italic">
                    תורתו היא שילוב של עומק המסורת עם בהירות המחשבה, מתוך שליחות להאיר את דרכה של תורת ארץ ישראל לדורנו.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key milestones & books */}
        <section className="grid md:grid-cols-2 gap-8" aria-label="תחנות ופרסומים">
          <Card className="shadow-lg hover:shadow-xl transition-shadow bg-[#FAF8F2]">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-px bg-secondary" aria-hidden="true" />
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-secondary">תחנות מרכזיות</h2>
              </div>
              <ul className="space-y-4" role="list">
                {['ר"מ בישיבת "כרם ביבנה"', 'הרב הראשי של העיר נתניה', 'הרב הראשי לישראל', 'נשיא מועצת הרבנות הראשית לישראל'].map((item) => (
                  <li key={item} className="flex gap-4 items-start">
                    <div className="mt-2 w-2 h-2 rounded-full bg-secondary flex-shrink-0" aria-hidden="true" />
                    <span className="text-base sm:text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow bg-[#FAF8F2]">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-px bg-secondary" aria-hidden="true" />
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-secondary">ספרים ופרסומים</h2>
              </div>
              <ul className="space-y-4" role="list">
                {['מעשה רוקם על התורה', 'מעשה רוקם על מועדי השנה'].map((item) => (
                  <li key={item} className="flex gap-4 items-start">
                    <div className="mt-2 w-2 h-2 rounded-full bg-secondary flex-shrink-0" aria-hidden="true" />
                    <span className="text-base sm:text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
