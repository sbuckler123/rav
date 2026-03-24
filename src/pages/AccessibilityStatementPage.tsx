import PageHeader from '@/components/PageHeader';
import { Mail, Phone, Calendar } from 'lucide-react';

export default function AccessibilityStatementPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="הצהרת נגישות" subtitle="מחויבות לנגישות דיגיטלית לכלל המשתמשים" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl py-12">
        <article className="prose prose-sm sm:prose lg:prose-lg max-w-none space-y-8" lang="he" dir="rtl">

          {/* ── מבוא ── */}
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-3">כללי</h2>
            <p className="text-foreground leading-relaxed">
              הרבנות הראשית לישראל מחויבת להנגיש את האתר הרשמי של הרב קלמן מאיר בר שליט"א
              לכלל הציבור, לרבות אנשים עם מוגבלות, בהתאם לחוק שוויון זכויות לאנשים עם
              מוגבלות, התשנ"ח–1998, ולתקנות הנגישות לשירות (התאמות נגישות לאתר אינטרנט),
              התשע"ה–2014.
            </p>
            <p className="text-foreground leading-relaxed mt-3">
              אתר זה נמצא בתהליך שיפור מתמיד של הנגישות. אנו פועלים להתאים את תכני האתר
              לתקן הישראלי{' '}
              <span className="font-semibold">IS 5568</span> (המבוסס על{' '}
              <span className="font-semibold">WCAG 2.1 רמה AA</span>), אך טרם בוצע ביקורת
              נגישות מלאה ורשמית. הצהרה זו משקפת את מצב הנגישות בפועל נכון למועד פרסומה.
            </p>
          </section>

          <hr className="border-border" />

          {/* ── מה נגיש ── */}
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-3">
              תכונות נגישות קיימות באתר
            </h2>
            <ul className="space-y-2 text-foreground">
              {[
                'תמיכה מלאה בכיווניות ימין–שמאל (RTL) ובשפה העברית',
                'כלי נגישות צף הכולל: שינוי גודל גופן (3 רמות), מצב ניגודיות גבוהה ומצב גווני אפור',
                'שמירת הגדרות הנגישות של המשתמש בין ביקורים',
                'שימוש ברכיבי HTML סמנטיים: כותרת ראשית, ניווט, אזור תוכן ראשי ופוטר',
                'תוויות ARIA לרכיבי ניווט, כפתורים ורכיבים אינטראקטיביים',
                'ניגודיות צבעים בסיסית בין טקסט לרקע',
                'ניתן לעבור בין אזורי הדף באמצעות מקלדת',
                'כפתורים ואזורי לחיצה בגודל מינימלי נוח למגע (44×44 פיקסל)',
                'תמיכה בשינוי גודל גופן דרך הגדרות הדפדפן ללא שבירת הפריסה',
                'הדף מגיב (Responsive) ומותאם לצפייה במובייל, טאבלט ומחשב שולחני',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-border" />

          {/* ── מה עדיין לא נגיש ── */}
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-3">
              מגבלות ידועות
            </h2>
            <p className="text-foreground leading-relaxed mb-3">
              להלן תחומים שאנו יודעים כי טרם מומשה בהם נגישות מלאה, ואנו עובדים על
              שיפורם:
            </p>
            <ul className="space-y-2 text-foreground">
              {[
                'תיאורי טקסט חלופי (alt) לחלק מהתמונות עשויים להיות חסרים או לא מספקים',
                'תכני וידאו אינם מוצגים כרגע עם כתוביות (CC)',
                'מסמכי PDF מוטמעים באתר אינם בהכרח נגישים לקוראי מסך',
                'טרם בוצע בדיקת נגישות מלאה עם קוראי מסך (NVDA, VoiceOver)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-border" />

          {/* ── פנייה בנושא נגישות ── */}
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-3">
              פנייה בנושא נגישות
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              נתקלתם בתוכן שאינו נגיש, או זקוקים לעזרה בגישה לתוכן כלשהו? אנא פנו
              אלינו — נשמח לסייע ולטפל בכל פנייה בהקדם האפשרי.
            </p>

            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
              <p className="font-bold text-primary text-sm">רכז הנגישות — הרבנות הראשית לישראל</p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 text-secondary flex-shrink-0" />
                <a href="mailto:Kh@rab.gov.il" className="hover:text-secondary transition-colors underline underline-offset-2">
                  Kh@rab.gov.il
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Phone className="h-4 w-4 text-secondary flex-shrink-0" />
                <a href="tel:025313131" className="hover:text-secondary transition-colors">
                  02-5313131
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                זמן מענה מוערך: עד 5 ימי עסקים.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* ── אכיפה ── */}
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-3">
              אי–שביעות רצון וגורמי אכיפה
            </h2>
            <p className="text-foreground leading-relaxed">
              אם לא קיבלתם מענה מספק לפנייתכם בנושא נגישות, תוכלו לפנות לנציב
              שוויון זכויות לאנשים עם מוגבלות במשרד המשפטים:{' '}
              <a
                href="https://www.justice.gov.il/Units/NetzivutShivyon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors"
              >
                justice.gov.il
              </a>
              .
            </p>
          </section>

          <hr className="border-border" />

          {/* ── תאריך עדכון ── */}
          <section>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-secondary flex-shrink-0" />
              <span>הצהרה זו עודכנה לאחרונה: מרץ 2026</span>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}
