import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

const events = [
  { 
    id: 1, 
    title: 'שיעור שבועי במסכת ברכות', 
    date: '20.01.2024', 
    time: '20:00', 
    location: 'בית הכנסת הגדול, ירושלים',
    description: 'שיעור שבועי קבוע במסכת ברכות עם עיון בסוגיות',
    capacity: 150
  },
  { 
    id: 2, 
    title: 'כנס הלכה ארצי', 
    date: '25.01.2024', 
    time: '09:00-17:00', 
    location: 'מלון רמדה, ירושלים',
    description: 'כנס יום שלם בנושאי הלכה עכשוויים עם מרצים מובילים',
    capacity: 500
  },
  { 
    id: 3, 
    title: 'הרצאה: יהדות ומדע', 
    date: '28.01.2024', 
    time: '19:30', 
    location: 'אולם בית הרב, תל אביב',
    description: 'הרצאה מרתקת על החיבור בין תורה למדע בעידן המודרני',
    capacity: 200
  },
  { 
    id: 4, 
    title: 'סיום מסכת שבת', 
    date: '02.02.2024', 
    time: '18:00', 
    location: 'ישיבת אור התורה, ירושלים',
    description: 'סיום מסכת שבת עם הרב ותלמידי הישיבה',
    capacity: 300
  },
  { 
    id: 5, 
    title: 'שיעור לנשים: הלכות נידה', 
    date: '05.02.2024', 
    time: '20:00', 
    location: 'מרכז הקהילה, בני ברק',
    description: 'שיעור מיוחד לנשים בהלכות טהרת המשפחה',
    capacity: 120
  },
  { 
    id: 6, 
    title: 'יום עיון בהלכות פסח', 
    date: '10.02.2024', 
    time: '09:00-16:00', 
    location: 'אולם הרבנות הראשית, ירושלים',
    description: 'יום עיון מקיף בהכנה לחג הפסח - הלכות ומנהגים',
    capacity: 400
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/*<h1 className="text-4xl font-serif font-bold text-center mb-8">לוח אירועים</h1>*/}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary text-center mb-4">
          לוח שיעורים
          </h1>
          <p className="text-lg text-center text-muted-foreground mb-6">
          
          </p>
          {/* קו זהב דקורטיבי */}
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
            <div className="h-px flex-1 bg-gradient-to-l from-secondary to-transparent"></div>
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <div className="h-px flex-1 bg-gradient-to-r from-secondary to-transparent"></div>
          </div>
        </div>
      </section>
      
      <div className="space-y-6 max-w-5xl mx-auto">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* תאריך */}
                <div className="flex-shrink-0 text-center lg:text-right">
                  <div className="inline-block bg-secondary/10 p-6 rounded-lg">
                    <Calendar className="h-10 w-10 text-secondary mx-auto mb-2" />
                    <div className="font-bold text-2xl">{event.date.split('.')[0]}</div>
                    <div className="text-muted-foreground">
                      {event.date.split('.')[1]}/{event.date.split('.')[2]}
                    </div>
                  </div>
                </div>
                
                {/* פרטים */}
                <div className="flex-1">
                  <h3 className="font-bold text-2xl mb-3">{event.title}</h3>
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{event.time}</span>
                    </div>
                   {/* <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span>מקומות: {event.capacity}</span>
                    </div>*/}
                    <div className="flex items-center gap-2 text-sm md:col-span-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button>הוסף ליומן</Button>
                    <Button variant="outline">פרטים נוספים</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}