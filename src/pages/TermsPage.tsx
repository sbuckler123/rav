import PageHeader from '@/components/PageHeader';
import { Mail, Phone, Calendar } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="תנאי שימוש" subtitle="אנא קראו את התנאים לפני השימוש באתר" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl py-8 sm:py-12">
        <article className="space-y-8 sm:space-y-10" lang="he" dir="rtl">

          {/* ── מבוא ── */}
          <section>
            <p className="text-foreground leading-relaxed">
              ברוכים הבאים לאתר הרשמי של הרב קלמן מאיר בר שליט"א. תנאי שימוש אלו
              ("התנאים") מסדירים את השימוש שלכם באתר האישי המופעל על ידי
              הרב קלמן מאיר בר שליט"א ("אנו" או "הרב").
            </p>
            <p className="text-foreground leading-relaxed mt-3">
              הכניסה לאתר והשימוש בו מהווים הסכמה לתנאים המפורטים להלן. אם אינכם
              מסכימים לאחד מהתנאים, אנא הימנעו מהשימוש באתר.
            </p>
          </section>

          <Divider />

          {/* ── 1. הגדרות ── */}
          <Section title="1. הגדרות">
            <ul className="space-y-2">
              {[
                { term: '"האתר"', def: 'האתר הרשמי של הרב קלמן מאיר בר שליט"א, הרב הראשי לישראל.' },
                { term: '"המשתמש"', def: 'כל אדם המבקר באתר, עיון בתכנים או משתמש בשירותי האתר.' },
                { term: '"התוכן"', def: 'מאמרים, שיעורים, שאלות ותשובות, תמונות, וידאו וכל חומר אחר המפורסם באתר.' },
                { term: '"הטופס"', def: 'טופס "שאל את הרב" המאפשר שליחת שאלות לרב.' },
              ].map(({ term, def }) => (
                <li key={term} className="flex items-start gap-2 text-foreground">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                  <span><span className="font-semibold text-primary">{term}</span> — {def}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Divider />

          {/* ── 2. שימוש מותר ── */}
          <Section title="2. שימוש מותר באתר">
            <p>האתר מיועד לשימוש אישי, לימודי ורוחני. מותר לכם:</p>
            <BulletList items={[
              'לעיין בתכנים, לקרוא מאמרים ולצפות בשיעורים לצורך אישי',
              'לשלוח שאלות לרב דרך הטופס המיועד לכך',
              'לשתף תכנים מהאתר תוך ציון המקור',
            ]} />

            <p className="mt-4 font-medium text-primary">אסור לכם:</p>
            <BulletList items={[
              'להעתיק, לשכפל או להפיץ תכנים לצרכים מסחריים ללא אישור מפורש',
              'לפרסם תכנים מטעים, פוגעניים או בלתי חוקיים דרך הטפסים',
              'לנסות לפרוץ, לשבש או לפגוע בתפקוד האתר',
              'לאסוף נתונים אוטומטית (scraping) ללא אישור מוקדם בכתב',
              'להתחזות לאחר או לספק מידע שגוי בעת פנייה לרב',
            ]} />
          </Section>

          <Divider />

          {/* ── 3. קניין רוחני ── */}
          <Section title="3. קניין רוחני וזכויות יוצרים">
            <p>
              כל התכנים המופיעים באתר — לרבות מאמרים, שיעורים, פסקי הלכה, תמונות
              ועיצוב — הם רכושו של הרב קלמן מאיר בר
              שליט"א, ומוגנים בחוק זכות יוצרים, התשס"ח–2007.
            </p>
            <p className="mt-3">
              ניתן לצטט קטעים קצרים לצורכי לימוד, עיתונות או ביקורת, בתנאי שיצוין
              המקור במפורש. כל שימוש מסחרי בתכנים מחייב קבלת אישור בכתב מהארגון מראש.
            </p>
          </Section>

          <Divider />

          {/* ── 4. שאלות לרב ── */}
          <Section title='4. שאלות לרב — "שאל את הרב"'>
            <p>
              האתר מציע אפשרות לשלוח שאלות הלכתיות ורוחניות לרב. בשימוש בשירות זה
              אתם מאשרים כי:
            </p>
            <BulletList items={[
              'המידע שמסרתם (שם ודוא"ל) נכון ומדויק',
              'השאלה לגיטימית ומכבדת',
              'ייתכן כי לא כל שאלה תזכה למענה, בהתאם לשיקול דעת הצוות',
              'הארגון רשאי להשתמש בשאלות ובתשובות לפרסום באתר, לאחר השמטת פרטים מזהים',
              'אין להסתמך על התשובות כייעוץ משפטי, רפואי או פיננסי — הן מיועדות להדרכה רוחנית–הלכתית בלבד',
            ]} />
          </Section>

          <Divider />

          {/* ── 5. הגבלת אחריות ── */}
          <Section title="5. הגבלת אחריות">
            <p>
              האתר והתכנים ניתנים "כמות שהם" (AS IS). אנו עושים מאמצים לוודא שהמידע
              מדויק ועדכני, אך איננו אחראים לטעויות, השמטות או שינויים שחלו לאחר
              הפרסום.
            </p>
            <BulletList items={[
              'לא נישא באחריות לנזק ישיר, עקיף או תוצאתי הנובע מהסתמכות על תכני האתר',
              'לא נישא באחריות להפסקות שירות זמניות בשל תחזוקה או כוח עליון',
              'קישורים לאתרים חיצוניים אינם באחריותנו — בדקו את מדיניות האתר המקושר',
            ]} />
            <p className="mt-3 text-sm text-muted-foreground">
              שאלות הלכתיות הנוגעות לבריאות, ממון או מצבים דחופים — אנא פנו לרב
              מוסמך באופן ישיר.
            </p>
          </Section>

          <Divider />

          {/* ── 6. פרטיות ── */}
          <Section title="6. פרטיות ועוגיות">
            <p>
              אנו מכבדים את פרטיותכם. השימוש באתר כפוף גם ל{' '}
              <a href="/privacy" className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors font-medium">
                מדיניות הפרטיות
              </a>
              {' '}ול{' '}
              <a href="/cookies" className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors font-medium">
                מדיניות העוגיות
              </a>
              {' '}שלנו, המהוות חלק בלתי נפרד מתנאים אלו.
            </p>
          </Section>

          <Divider />

          {/* ── 7. שינויים בתנאים ── */}
          <Section title="7. שינויים בתנאים">
            <p>
              אנו רשאים לעדכן תנאים אלו מעת לעת. שינויים מהותיים יפורסמו באתר עם
              תאריך כניסה לתוקף מעודכן.
            </p>
            <p className="mt-3">
              המשך השימוש באתר לאחר פרסום השינויים מהווה הסכמה לתנאים המעודכנים.
              מומלץ לבדוק עמוד זה מעת לעת.
            </p>
          </Section>

          <Divider />

          {/* ── 8. ביטול וסיום ── */}
          <Section title="8. ביטול וסיום">
            <p>
              מכיוון שהאתר אינו מצריך הרשמה לגלישה בתכנים, אין "חשבון" לסגור.
              עם זאת:
            </p>
            <BulletList items={[
              'ניתן לבקש מחיקת פרטים שנמסרו דרך הטפסים — פנו אלינו לכתובת המייל המפורטת להלן',
              'הארגון רשאי לחסום גישה למי שמפר את תנאי השימוש, ללא הודעה מוקדמת',
              'סיום השימוש באתר אינו פוגע בתוקף ההוראות המשרדות מטבען (כגון קניין רוחני וסמכות שיפוט)',
            ]} />
          </Section>

          <Divider />

          {/* ── 9. הפרדת סעיפים ── */}
          <Section title="9. הפרדת סעיפים">
            <p>
              אם בית משפט מוסמך יקבע כי סעיף מסעיפי תנאים אלו אינו תקף או אינו
              ניתן לאכיפה, יופרד אותו סעיף מיתר התנאים. שאר התנאים ימשיכו לחול
              במלואם וכאילו הסעיף שהוצא לא היה קיים מלכתחילה.
            </p>
          </Section>

          <Divider />

          {/* ── 10. דין וסמכות שיפוט ── */}
          <Section title="10. דין וסמכות שיפוט">
            <p>
              תנאי שימוש אלו כפופים לדיני מדינת ישראל. כל מחלוקת הנוגעת לתנאים
              אלו או לשימוש באתר תידון בבתי המשפט המוסמכים בישראל, ולהם בלבד תהא
              סמכות השיפוט הבלעדית.
            </p>
          </Section>

          <Divider />

          {/* ── 11. יצירת קשר ── */}
          <Section title="11. יצירת קשר">
            <p className="mb-4">לשאלות, הבהרות או פניות בנוגע לתנאי שימוש אלו:</p>
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
          </Section>

          <Divider />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-secondary flex-shrink-0" />
            <span>תנאי שימוש אלו עודכנו לאחרונה: מרץ 2026</span>
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
    <ul className="space-y-2 mt-2">
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
