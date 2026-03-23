import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Download, Printer, Share2, MessageCircle, Calendar, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

export default function HalachaDetailPage() {
  const { id } = useParams();

  const halacha = {
    title: 'דיני ברכות על מאכלי קיץ',
    date: '14.07.2025',
    category: 'ברכות',
    readTime: '8 דקות',
    isNew: true,
    summary: 'בימי הקיץ אנו נתקלים במגוון רחב של פירות ומאכלים מיוחדים. בפסק זה נבאר את ההלכות הנוגעות לברכות על פירות קיץ, מאכלים קפואים, ומשקאות מרעננים.',
    mainPoints: 'למעשה: יש לברך על פירות קפואים בורא פרי העץ/האדמה, על גלידה שהעדן, ועל משקאות קרים שהכל.',
    background: 'בעונת הקיץ רבים נוהגים לצרוך מאכלים קרים ומרעננים. השאלה המרכזית היא האם הקירור או ההקפאה משנים את מעמד המאכל מבחינת הברכה.',
    sources: 'נידון בשאלה זו בגמרא ברכות לח, א. הרמב"ם (הלכות ברכות פ"ח) והשולחן ערוך (או"ח סימן רב-רג) מביאים את עיקרי הדינים.',
    poskim: 'הפוסקים נחלקו בשאלת פירות מיובשים וקפואים. החזון איש סובר שאין שינוי בברכה, ואילו הגרש"ז אויערבך דן בהשפעת ההקפאה.',
    psak: 'הרב פוסק שיש לברך על פירות קפואים את הברכה המקורית (בורא פרי העץ או האדמה), שכן ההקפאה אינה משנה את מהות הפרי. על גלידה מברכים שהכל, אלא אם כן יש בה חתיכות פרי ניכרות.',
    practical: [
      'פירות קפואים - מברכים בורא פרי העץ/האדמה לפי המקור',
      'גלידה רגילה - שהכל נהיה בדברו',
      'גלידת פירות עם חתיכות - בורא פרי העץ על החתיכות, שהכל על הגלידה',
      'משקאות קרים ומיצים - שהכל, אלא אם כן סחטו בפניו',
      'ארטיק פירות - שהכל, אלא אם כן יש חתיכות פרי ברורות'
    ],
    relatedPsakim: [
      { id: 2, title: 'הפעלת מזגן בשבת', category: 'שבת' },
      { id: 3, title: 'ברכות על משקאות חמים', category: 'ברכות' },
      { id: 4, title: 'דיני ברכה על מאפים', category: 'ברכות' }
    ]
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <Breadcrumbs items={[
          { label: 'דף הבית', href: '/' },
          { label: 'פסקי הלכה', href: '/halacha' },
          { label: halacha.category, href: `/halacha?category=${halacha.category}` },
          { label: halacha.title }
        ]} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* תוכן ראשי */}
          <div className="lg:col-span-2 space-y-6">
            {/* כותרת ומטא-דאטה */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{halacha.category}</Badge>
                  {halacha.isNew && <Badge className="bg-green-600">חדש</Badge>}
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {halacha.readTime}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{halacha.title}</h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {halacha.date}
                </div>
              </CardContent>
            </Card>

            {/* סיכום */}
            <Card className="bg-amber-50 border-r-4 border-r-secondary">
              <CardContent className="p-6">
                <h2 className="text-xl font-serif font-bold mb-4">סיכום</h2>
                <p className="leading-relaxed mb-4">{halacha.summary}</p>
                <div className="pt-4 border-t border-secondary/20">
                  <p className="font-bold text-primary">{halacha.mainPoints}</p>
                </div>
              </CardContent>
            </Card>

            {/* רקע השאלה */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-serif font-bold mb-4">רקע השאלה</h2>
                <p className="leading-relaxed">{halacha.background}</p>
              </CardContent>
            </Card>

            {/* מקורות */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-serif font-bold mb-4">מקורות</h2>
                <p className="leading-relaxed">{halacha.sources}</p>
              </CardContent>
            </Card>

            {/* דעות הפוסקים */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-serif font-bold mb-4">דעות הפוסקים</h2>
                <p className="leading-relaxed">{halacha.poskim}</p>
              </CardContent>
            </Card>

            {/* פסיקת הרב */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-serif font-bold mb-4">פסיקת הרב</h2>
                <p className="leading-relaxed">{halacha.psak}</p>
              </CardContent>
            </Card>

            {/* הלכה למעשה */}
            <Card className="bg-blue-50 border-2 border-primary">
              <CardContent className="p-6">
                <h2 className="text-xl font-serif font-bold mb-4 text-primary">הלכה למעשה</h2>
                <ul className="space-y-3">
                  {halacha.practical.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-primary font-bold">{i + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* כפתורי פעולה */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="gap-2 bg-secondary text-primary hover:bg-secondary/90">
                    <Download className="h-4 w-4" />
                    הורד PDF
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    הדפס
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    שתף
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    שאל המשך
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ניווט */}
            <div className="flex justify-between">
              <Button variant="outline" className="gap-2">
                <ChevronRight className="h-4 w-4" />
                הפסק הקודם
              </Button>
              <Button variant="outline" className="gap-2">
                הפסק הבא
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">פסקים קשורים</h3>
                <div className="space-y-3">
                  {halacha.relatedPsakim.map((related) => (
                    <Link key={related.id} to={`/halacha/${related.id}`}>
                      <div className="p-3 hover:bg-muted rounded-lg transition-colors cursor-pointer">
                        <Badge variant="secondary" className="mb-2">{related.category}</Badge>
                        <p className="text-sm font-medium">{related.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">קטגוריות</h3>
                <div className="flex flex-wrap gap-2">
                  {['שבת', 'כשרות', 'תפילה', 'ברכות', 'מועדים'].map((cat) => (
                    <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
