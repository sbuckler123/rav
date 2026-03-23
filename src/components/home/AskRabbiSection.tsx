import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const recentAnswers = [
  { id: 1, question: 'האם מותר לברך על פירות מיובשים?', date: '14.01.2024' },
  { id: 2, question: 'דין הדלקת נרות בשבת בחורף', date: '13.01.2024' },
  { id: 3, question: 'כשרות מוצרים ללא תעודת כשרות', date: '11.01.2024' },
];

export default function AskRabbiSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-serif font-bold text-center mb-10">שאל את הרב</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* טופס שאלה */}
        <Card>
          <CardHeader>
            <CardTitle>שלח שאלה חדשה</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">שם מלא</Label>
                <Input id="name" placeholder="הכנס שם מלא" />
              </div>
              <div>
                <Label htmlFor="email">כתובת דוא״ל</Label>
                <Input id="email" type="email" placeholder="example@email.com" />
              </div>
              <div>
                <Label htmlFor="category">נושא השאלה</Label>
                 
                <Select>
                
                  <SelectTrigger id="category">
                
                    <SelectValue placeholder="בחר נושא" />
               
                  </SelectTrigger>
                     
                  <SelectContent>
                    <SelectItem value="shabbat">שבת</SelectItem>
                    <SelectItem value="kashrut">כשרות</SelectItem>
                    <SelectItem value="prayer">תפילה</SelectItem>
                    <SelectItem value="blessings">ברכות</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
                  
              </div>
              <div>
                <Label htmlFor="question">תוכן השאלה</Label>
                <Textarea id="question" placeholder="פרט את שאלתך..." rows={5} />
              </div>
              <Button className="w-full" size="lg">שלח שאלה</Button>
            </form>
          </CardContent>
        </Card>

        {/* תשובות נבחרות */}
        <Card>
          <CardHeader>
            <CardTitle>תשובות נבחרות מהשבוע האחרון</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnswers.map((answer) => (
                <div key={answer.id} className="border-b pb-4 last:border-0">
                  <h4 className="font-semibold mb-1">{answer.question}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{answer.date}</p>
                  <Button variant="link" className="p-0 h-auto">
                    לתשובה המלאה ←
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
