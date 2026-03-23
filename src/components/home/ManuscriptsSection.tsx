import { Card, CardContent } from '@/components/ui/card';

const manuscripts = [
  { id: 1, title: 'הערות על מסכת שבת', description: 'חידושים בכתב יד על דף קכ״ג' },
  { id: 2, title: 'רשימות מתוך שיעור', description: 'הערות מהשיעור השבועי בישיבה' },
  { id: 3, title: 'תשובה בכתב יד', description: 'פסק הלכה בנושא ברכות' },
];

export default function ManuscriptsSection() {
  return (
    <section className="bg-muted py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-serif font-bold text-center mb-4">מכתב ידו של הרב</h2>
        <p className="text-center text-muted-foreground mb-10">אוסף נדיר של כתבי יד, הערות ופסקי הלכה</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {manuscripts.map((manuscript) => (
            <Card key={manuscript.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-64 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border-b-2 border-secondary/30">
                <div className="text-6xl font-serif text-primary/20">כתב יד</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold mb-2">{manuscript.title}</h3>
                <p className="text-sm text-muted-foreground">{manuscript.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}