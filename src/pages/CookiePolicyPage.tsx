import PageHeader from '@/components/PageHeader';
import { Mail, Calendar } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="מדיניות עוגיות" subtitle="מידע על השימוש בקבצי Cookie באתר" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl py-8 sm:py-12">
        <article className="space-y-8 sm:space-y-10" lang="he" dir="rtl">

          {/* ── מבוא ── */}
          <section>
            <p className="text-foreground leading-relaxed">
              מדיניות זו מסבירה מהן עוגיות (Cookies), כיצד האתר הרשמי של הרב קלמן מאיר
              בר שליט"א משתמש בהן, ואילו אפשרויות שליטה עומדות לרשותכם. קריאת המדיניות
              תסייע לכם להבין אילו מידע נאסף ולמה.
            </p>
          </section>

          <Divider />

          {/* ── 1. מהי עוגייה ── */}
          <Section title="1. מהי עוגייה (Cookie)?">
            <p>
              עוגייה היא קובץ טקסט קטן שנשמר במכשירכם (מחשב, טאבלט, טלפון) בעת ביקור
              באתר. העוגיות מאפשרות לאתר לזכור פעולות והעדפות שבחרתם — כגון גודל גופן
              או מצב תצוגה — כדי שלא תצטרכו להגדיר אותם מחדש בכל ביקור.
            </p>
            <p>
              בנוסף לעוגיות, האתר עושה שימוש ב-<span className="font-medium">localStorage</span> —
              מנגנון אחסון מקומי בדפדפן שעובד באופן דומה אך הנתונים נשמרים רק במכשירכם
              ואינם נשלחים לשרת.
            </p>
          </Section>

          <Divider />

          {/* ── 2. סוגי עוגיות ── */}
          <Section title="2. סוגי העוגיות בהן אנו משתמשים">

            <div className="space-y-5">

              {/* הכרחיות */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    הכרחיות
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  עוגיות אלו נחוצות לתפקוד הבסיסי של האתר. ללא עוגיות אלו חלקים מהאתר
                  לא יפעלו כראוי. אינן מכילות מידע מזהה אישי ואינן דורשות הסכמה.
                </p>
              </div>

              {/* פונקציונליות */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-secondary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    פונקציונליות
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  עוגיות ו-localStorage המשמשים לשמירת הגדרות נגישות שבחרתם (גודל גופן,
                  ניגודיות גבוהה, גוני אפור). מידע זה נשמר אך ורק במכשירכם ואינו נשלח
                  לשרתינו.
                </p>
              </div>

              {/* ניתוח ── */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-muted-foreground/15 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    ניתוח סטטיסטי
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  עוגיות המשמשות לניתוח אנונימי של דפוסי גלישה — כגון אילו עמודים נצפו
                  ולכמה זמן — לצורך שיפור תכני האתר וחוויית המשתמש. המידע מצטבר ואינו
                  מזהה אתכם אישית.
                </p>
              </div>

            </div>
          </Section>

          <Divider />

          {/* ── 3. טבלת עוגיות ── */}
          <Section title="3. פירוט העוגיות ואחסון מקומי">
            <p className="mb-4 text-sm text-muted-foreground">
              הטבלה הבאה מפרטת את קבצי ה-Cookie וה-localStorage הקיימים באתר:
            </p>

            {/* Responsive table wrapper */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[540px] text-sm border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    {['שם', 'סוג', 'מטרה', 'תפוגה'].map(h => (
                      <th key={h} className="px-4 py-3 text-right font-semibold text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'acc-settings',
                      type: 'localStorage',
                      purpose: 'שמירת הגדרות נגישות (גופן, ניגודיות, גוני אפור)',
                      expires: 'קבוע (ניתן למחיקה ידנית)',
                    },
                    {
                      name: 'session',
                      type: 'Cookie הכרחית',
                      purpose: 'ניהול סשן גלישה תקין',
                      expires: 'סיום הפגישה',
                    },
                    {
                      name: 'umami.uuid',
                      type: 'ללא עוגיות',
                      purpose: 'Umami Analytics — ניתוח תנועה אנונימי ללא עוגיות. זיהוי מבוסס session בלבד, ללא מעקב בין אתרים',
                      expires: 'לא רלוונטי (ללא עוגיות)',
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-primary font-medium align-top">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 align-top text-foreground">{row.type}</td>
                      <td className="px-4 py-3 align-top text-foreground">{row.purpose}</td>
                      <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                        {row.expires}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              * רשימה זו עשויה להתעדכן בהתאם לשינויים באתר. בדקו מדיניות זו מעת לעת.
            </p>
          </Section>

          <Divider />

          {/* ── 4. עוגיות צד שלישי ── */}
          <Section title="4. עוגיות של צדדים שלישיים">
            <p>
              חלק מהשירותים החיצוניים שאנו משתמשים בהם עשויים להציב עוגיות משלהם:
            </p>
            <ul className="mt-3 space-y-3">
              {[
                {
                  name: 'Umami Analytics',
                  desc: 'כלי ניתוח תנועה ידידותי לפרטיות. אינו משתמש בעוגיות ואינו שומר מידע אישי מזהה.',
                  link: 'https://umami.is/privacy',
                  linkLabel: 'מדיניות Umami',
                  noCookies: true,
                },
                {
                  name: 'Airtable',
                  desc: 'שירות לאחסון טפסי יצירת קשר. עשוי לשמור עוגיות טכניות לתפקוד.',
                  link: 'https://airtable.com/privacy',
                  linkLabel: 'מדיניות Airtable',
                },
                {
                  name: 'Cloudinary',
                  desc: 'שירות להגשת תמונות. עשוי לשמור עוגיות למטרות ביצועים.',
                  link: 'https://cloudinary.com/privacy',
                  linkLabel: 'מדיניות Cloudinary',
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-primary">{item.name}</span>
                    {(item as { noCookies?: boolean }).noCookies && (
                      <span className="mr-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        ✓ ללא עוגיות
                      </span>
                    )}
                    {' — '}
                    {item.desc}{' '}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors text-sm"
                    >
                      {item.linkLabel}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              אין לנו שליטה על העוגיות שצדדים שלישיים אלו מציבים. מומלץ לעיין במדיניות
              הפרטיות שלהם לפרטים נוספים.
            </p>
          </Section>

          <Divider />

          {/* ── 5. ניהול עוגיות ── */}
          <Section title="5. כיצד לנהל ולמחוק עוגיות">
            <p className="mb-3">
              תוכלו לשלוט בעוגיות ובאחסון המקומי בכמה דרכים:
            </p>
            <ul className="space-y-2">
              {[
                'דרך הגדרות הנגישות של האתר — לחצו על כפתור ♿ בפינה השמאלית התחתונה ובחרו "איפוס הגדרות"',
                'דרך הגדרות הדפדפן — ניתן לחסום, למחוק או להגביל עוגיות בכל דפדפן מודרני',
                'דרך כלי המפתחים של הדפדפן — ניתן למחוק ישירות רשומות localStorage',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-primary mb-2">הנחיות לפי דפדפן:</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {[
                  { label: 'Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                  { label: 'Firefox', url: 'https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer' },
                  { label: 'Safari', url: 'https://support.apple.com/guide/safari/manage-cookies-sfri11471' },
                  { label: 'Edge', url: 'https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge' },
                ].map(b => (
                  <a
                    key={b.label}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary hover:border-primary/50 hover:bg-muted transition-colors"
                  >
                    {b.label}
                  </a>
                ))}
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              שימו לב: חסימת עוגיות הכרחיות עלולה לפגוע בתפקוד חלקים מהאתר.
            </p>
          </Section>

          <Divider />

          {/* ── 6. שינויים ── */}
          <Section title="6. שינויים במדיניות">
            <p>
              אנו עשויים לעדכן מדיניות עוגיות זו מעת לעת בהתאם לשינויים טכנולוגיים
              או רגולטוריים. כל שינוי מהותי יפורסם בעמוד זה עם תאריך עדכון מעודכן.
              המשך השימוש באתר לאחר הפרסום מהווה הסכמה לתנאים המעודכנים.
            </p>
          </Section>

          <Divider />

          {/* ── 7. יצירת קשר ── */}
          <Section title="7. יצירת קשר">
            <p className="mb-4">לשאלות בנושא מדיניות עוגיות זו:</p>
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
              <p className="font-bold text-primary text-sm">הרבנות הראשית לישראל</p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 text-secondary flex-shrink-0" />
                <a
                  href="mailto:Kh@rab.gov.il"
                  className="hover:text-secondary transition-colors underline underline-offset-2 break-all"
                >
                  Kh@rab.gov.il
                </a>
              </div>
            </div>
          </Section>

          <Divider />

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

function Divider() {
  return <hr className="border-border" />;
}
