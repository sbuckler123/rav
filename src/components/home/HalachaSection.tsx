import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar } from 'lucide-react';

const halachot = [
  { id: 1, title: 'דיני ברכות על מאכלי קיץ', date: '15.01.2024', category: 'ברכות' },
  { id: 2, title: 'הלכות הדלקת נרות שבת בזמנים שונים', date: '12.01.2024', category: 'שבת' },
  { id: 3, title: 'כשרות כלים שנשתמשו בפסח', date: '10.01.2024', category: 'כשרות' },
  { id: 4, title: 'דיני תפילה במנין מעורב', date: '08.01.2024', category: 'תפילה' },
  { id: 5, title: 'הלכות ברית מילה במקרים מיוחדים', date: '05.01.2024', category: 'מצוות' },
];

const categories = ['הכל', 'שבת', 'כשרות', 'תפילה', 'ברכות', 'מצוות'];

export default function HalachaSection() {
  return (
    <section className="bg-muted py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-serif font-bold text-center mb-10">פסקי הלכה נבחרים</h2>
        
        {/* סינון קטגוריות */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <Button key={cat} variant="outline" size="sm">
              {cat}
            </Button>
          ))}
        </div>

        {/* רשימת פסקים */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {halachot.map((halacha) => (
            <Card key={halacha.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary">{halacha.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {halacha.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg">{halacha.title}</h3>
                  </div>
                  <Button variant="outline">
                    לקריאה המלאה
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="gap-2">
            לכל פסקי ההלכה
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
