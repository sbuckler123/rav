import PageHeader from '@/components/PageHeader';
import { Mail, Phone, Calendar } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="מדיניות פרטיות" subtitle="כיצד אנו מטפלים במידע שלך" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl py-8 sm:py-12">
        <article className="space-y-8 sm:space-y-10" lang="he" dir="rtl">

          {/* ── מבוא ── */}
          <section>
            <p className="text-foreground leading-relaxed">
              מדיניות פרטיות זו מתארת כיצד הרב קלמן מאיר בר שליט"א ("אנו", "הרב") אוסף,
              משתמשת ומגינה על המידע שאתם מוסרים בעת השימוש באתר הרשמי של הרב קלמן מאיר
              בר שליט"א (<span className="font-medium">להלן: "האתר"</span>).
            </p>
            <p className="text-foreground leading-relaxed mt-3">
              מדיניות זו נכתבת בהתאם לחוק הגנת הפרטיות, התשמ"א–1981, לתקנות הגנת
              הפרטיות (אבטחת מידע), התשע"ז–2017, ולתקנות האיחוד האירופי להגנת מידע
              (GDPR) ככל שהן חלות.
            </p>
          </section>

          <Divider />

          {/* ── 1. מי אנחנו ── */}
          <Section title="1. מי אנחנו">
            <p>
              האתר האישי מופעל על ידי הרב קלמן מאיר בר שליט"א, הממוקם ברחוב אהליאב 5, ירושלים.
              האתר מיועד להנגשת תכנים דתיים ורוחניים לציבור הרחב: מאמרים, שיעורי תורה,
              שאלות ותשובות, ולוחות שיעורים ואירועים.
            </p>
          </Section>

          <Divider />

          {/* ── 2. איזה מידע נאסף ── */}
          <Section title="2. איזה מידע נאסף">
            <p className="mb-3">האתר אוסף שני סוגי מידע:</p>

            <p className="font-semibold text-primary mb-1">מידע שאתם מוסרים מרצונכם:</p>
            <BulletList items={[
              'שם פרטי — בעת שליחת שאלה לרב',
              'כתובת דוא"ל — לצורך משלוח תשובה לשאלתכם',
              'תוכן השאלה שנשלחת דרך טופס "שאל את הרב"',
            ]} />

            <p className="font-semibold text-primary mb-1 mt-4">מידע הנאסף באופן אוטומטי:</p>
            <BulletList items={[
              'נתוני גלישה טכניים (כתובת IP, סוג דפדפן, מערכת הפעלה)',
              'דפים שנצפו ומשך הביקור — לצורך שיפור חוויית המשתמש',
            ]} />

            <p className="text-sm text-muted-foreground mt-3">
              האתר <span className="font-medium">אינו</span> אוסף מידע רגיש כגון פרטי
              תשלום, מספרי זהות או מיקום גיאוגרפי מדויק.
            </p>
          </Section>

          <Divider />

          {/* ── 3. כיצד נאסף המידע ── */}
          <Section title="3. כיצד נאסף המידע">
            <BulletList items={[
              'טופס "שאל את הרב" — בו תמלאו את פרטיכם מרצונכם',
              'קבצי Cookie ו-localStorage — לשמירת הגדרות נגישות שבחרתם (מאוחסנות רק במכשירכם)',
              'נתוני גלישה — הנאספים אוטומטית על ידי שרת האתר ושירותי ניתוח',
            ]} />
          </Section>

          <Divider />

          {/* ── 4. מטרות השימוש ── */}
          <Section title="4. מטרות השימוש במידע">
            <BulletList items={[
              'מתן מענה לשאלות שנשלחו דרך הטופס',
              'שיפור תכני האתר ושיפור חוויית המשתמש',
              'ניתוח סטטיסטי מצטבר ואנונימי של תנועה באתר',
              'אבטחת האתר ומניעת שימוש לרעה',
            ]} />
            <p className="mt-3 text-sm text-muted-foreground">
              אנו <span className="font-medium">לא</span> משתמשים במידע לצרכי שיווק,
              ולא מוכרים אותו לצדדים שלישיים.
            </p>
          </Section>

          <Divider />

          {/* ── 5. עוגיות ── */}
          <Section title="5. עוגיות (Cookies) ואחסון מקומי">
            <p className="mb-3">האתר משתמש בשני מנגנוני אחסון:</p>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-semibold text-primary text-sm mb-1">localStorage</p>
                <p className="text-sm text-foreground">
                  שמירת הגדרות נגישות שבחרתם (גודל גופן, ניגודיות, גוני אפור). מידע זה
                  נשמר אך ורק במכשירכם ואינו נשלח לשרתינו.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-semibold text-primary text-sm mb-1">עוגיות טכניות</p>
                <p className="text-sm text-foreground">
                  עוגיות הכרחיות לתפקוד האתר. אינן מכילות מידע מזהה אישי ואינן משמשות
                  למטרות שיווקיות.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              תוכלו לנהל ולמחוק עוגיות דרך הגדרות הדפדפן שלכם בכל עת.
            </p>
          </Section>

          <Divider />

          {/* ── 6. אנליטיקה ── */}
          <Section title="6. כלי אנליטיקה — Umami Analytics">
            <p>
              האתר משתמש ב-{' '}
              <a
                href="https://umami.is"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors font-medium"
              >
                Umami Analytics
              </a>
              {' '}לניתוח תנועה ושיפור חוויית המשתמש. Umami הוא כלי ידידותי לפרטיות
              שאינו עוקב אחר משתמשים בין אתרים ואינו משתמש בעוגיות.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-semibold text-primary text-sm mb-2">מה נאסף</p>
                <BulletList items={[
                  'דפים שנצפו',
                  'משך הביקור',
                  'מדינה/עיר (משוער)',
                  'סוג הדפדפן והמכשיר',
                  'מקור ההפניה',
                ]} />
              </div>
              <div className="rounded-lg border border-green-100 bg-green-50/50 p-4">
                <p className="font-semibold text-primary text-sm mb-2">מה לא נאסף</p>
                <BulletList items={[
                  'מידע אישי מזהה',
                  'כתובת IP מלאה',
                  'עוגיות מעקב',
                  'פרופיל התנהגות אישי',
                ]} />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              כל הנתונים מצטברים ואנונימיים לחלוטין. למידע נוסף ראו{' '}
              <a
                href="https://umami.is/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors"
              >
                מדיניות הפרטיות של Umami
              </a>
              .
            </p>
          </Section>

          <Divider />

          {/* ── 8. צדדים שלישיים ── */}
          <Section title="8. שיתוף מידע עם צדדים שלישיים">
            <p className="mb-3">
              אנו עשויים לשתף מידע עם ספקי שירות חיצוניים הפועלים מטעמנו בלבד:
            </p>
            <BulletList items={[
              'Airtable — לאחסון ועיבוד שאלות שנשלחו דרך הטופס (ספק אמריקאי, עם הסכם עיבוד נתונים)',
              'Make.com (Celonis SE) — לצורך אוטומציה של תהליך קבלת השאלות ועיבודן. בעת שליחת שאלה, פרטי הפנייה (שם, דוא"ל, תוכן השאלה) מועברים לשירות זה לצורך ניתוב ועיבוד. ספק אירופאי (גרמניה), עומד בדרישות GDPR',
              'שירותי אחסון ענן — לצורך אחסון תמונות ותכנים (Cloudinary)',
              'Umami Analytics — לניתוח אנונימי של תנועת הגולשים (ראו סעיף 6)',
            ]} />
            <p className="mt-3 text-foreground">
              ספקים אלו אינם רשאים לעשות שימוש במידע למטרות משלהם. כל העברת מידע מחוץ
              לישראל מתבצעת בהתאם לחוק ובאמצעות ספקים שנחתם עמם הסכם מתאים.
            </p>
            <p className="mt-3 text-foreground">
              אנו <span className="font-medium">לא</span> חולקים מידע אישי עם גורמים
              שלישיים לצרכי פרסום, שיווק או מסחר.
            </p>
          </Section>

          <Divider />

          {/* ── 9. זכויות המשתמש ── */}
          <Section title="9. זכויות המשתמש">
            <p className="mb-3">
              בהתאם לחוק הגנת הפרטיות הישראלי, ולתקנות ה-GDPR עבור משתמשים מאירופה,
              עומדות לכם הזכויות הבאות:
            </p>
            <BulletList items={[
              'זכות עיון — לקבל מידע על הנתונים שנשמרו אודותיכם',
              'זכות תיקון — לבקש תיקון מידע שגוי או לא עדכני',
              'זכות מחיקה — לבקש מחיקת המידע האישי שלכם ("הזכות להישכח")',
              'זכות התנגדות — להתנגד לעיבוד מסוים של המידע שלכם',
              'זכות ניידות — לקבל עותק של המידע שלכם בפורמט מובנה',
            ]} />
            <p className="mt-3 text-sm text-muted-foreground">
              למימוש זכויות אלו, פנו אלינו בכתובת המפורטת בסעיף 11. נטפל בבקשתכם
              תוך 30 יום.
            </p>
          </Section>

          <Divider />

          {/* ── 10. אבטחת מידע ── */}
          <Section title="10. אבטחת מידע">
            <p>
              אנו נוקטים באמצעים טכניים וארגוניים סבירים להגנה על המידע שלכם בהתאם
              לתקנות הגנת הפרטיות (אבטחת מידע), התשע"ז–2017, לרבות:
            </p>
            <BulletList items={[
              'תקשורת מוצפנת בפרוטוקול HTTPS',
              'הגבלת גישה למידע אישי לעובדים המורשים בלבד',
              'שמירת המידע בשרתים מאובטחים',
            ]} />
            <p className="mt-3 text-foreground">
              למרות מאמצינו, אין ביכולתנו להבטיח אבטחה מוחלטת של מידע המועבר דרך
              האינטרנט. במקרה של פרצת אבטחה שעשויה לפגוע בכם, נודיע לכם בהתאם לחוק.
            </p>
          </Section>

          <Divider />

          {/* ── 11. שינויים במדיניות ── */}
          <Section title="11. שינויים במדיניות">
            <p>
              אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. שינויים מהותיים יפורסמו
              באתר לפחות 14 יום לפני כניסתם לתוקף. המשך השימוש באתר לאחר עדכון
              המדיניות מהווה הסכמה לתנאים החדשים.
            </p>
          </Section>

          <Divider />

          {/* ── 12. יצירת קשר ── */}
          <Section title="12. יצירת קשר">
            <p className="mb-4">
              לכל שאלה, בקשה או תלונה בנושא פרטיות, ניתן לפנות אלינו:
            </p>
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
              <p className="font-bold text-primary text-sm">הרב קלמן מאיר בר שליט"א</p>
              <p className="text-sm text-foreground">רחוב אהליאב 5, ירושלים</p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 text-secondary flex-shrink-0" />
                <a href="mailto:Kh@rab.gov.il" className="hover:text-secondary transition-colors underline underline-offset-2 break-all">
                  Kh@rab.gov.il
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Phone className="h-4 w-4 text-secondary flex-shrink-0" />
                <a href="tel:025313131" className="hover:text-secondary transition-colors">
                  02-5313131
                </a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              לפניות הנוגעות לשמירה על זכויות לפי ה-GDPR, תוכלו לפנות גם לרשות
              להגנת הפרטיות בישראל:{' '}
              <a
                href="https://www.gov.il/he/departments/the_privacy_protection_authority"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors"
              >
                gov.il/privacy
              </a>
              .
            </p>
          </Section>

          <Divider />

          {/* ── תאריך ── */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-secondary flex-shrink-0" />
            <span>מדיניות זו עודכנה לאחרונה: מרץ 2026</span>
          </div>

        </article>
      </div>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-lg sm:text-xl font-bold text-primary mb-3">{title}</h2>
      <div className="text-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-foreground">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return <hr className="border-border" />;
}
