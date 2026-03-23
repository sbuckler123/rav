import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { submitQuestion } from '@/api/submitQuestion';
import { CheckCircle, Send } from 'lucide-react';

interface Props {
  categories: { id: string; name: string }[];
}

export default function QuestionForm({ categories }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [question, setQuestion] = useState('');
  const [allowPublic, setAllowPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !question) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return;
    }
    setSubmitting(true);
    try {
      const selectedCategory = categories.find(c => c.id === categoryId);
      await submitQuestion({
        name,
        email,
        categoryId: categoryId || undefined,
        topic: selectedCategory?.name,
        question,
        allowPublic,
      });
      setSubmitted(true);
      toast.success('שאלתך נשלחה בהצלחה!');
    } catch {
      toast.error('אירעה שגיאה, נא נסה שנית');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border shadow-sm bg-white">
        <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-9 w-9 text-green-500" />
          </div>
          <h3 className="text-xl font-serif font-bold text-primary mb-2">שאלתך נתקבלה!</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6 leading-relaxed">
            תודה על פנייתך. נשיב לשאלתך בהקדם האפשרי.
          </p>
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => { setSubmitted(false); setName(''); setEmail(''); setCategoryId(''); setQuestion(''); setAllowPublic(false); }}
          >
            שלח שאלה נוספת
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm bg-white">
      <CardContent className="p-5 sm:p-7">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 bg-secondary rounded-full" />
          <h2 className="font-serif font-bold text-base sm:text-lg text-primary">שלח שאלה לרב</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Email row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">שם <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="שמך המלא"
                className="min-h-[44px] border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">אימייל <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="min-h-[44px] border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary"
                required
              />
            </div>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">נושא השאלה</Label>
              <Select value={categoryId} onValueChange={setCategoryId} dir="rtl">
                <SelectTrigger className="min-h-[44px] border border-input bg-white focus:ring-1 focus:border-secondary">
                  <SelectValue placeholder="בחר נושא (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Question */}
          <div className="space-y-1.5">
            <Label htmlFor="question" className="text-sm font-medium">תוכן השאלה <span className="text-destructive">*</span></Label>
            <Textarea
              id="question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="פרט את שאלתך כאן..."
              rows={5}
              className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none"
              required
            />
          </div>

          {/* Allow public */}
          <div className="flex items-start gap-3 p-3.5 bg-white border border-input rounded-lg">
            <Checkbox
              id="allowPublic"
              checked={allowPublic}
              onCheckedChange={v => setAllowPublic(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="allowPublic" className="cursor-pointer text-sm leading-snug text-muted-foreground">
              מאשר פרסום השאלה והתשובה באתר באנונימיות מלאה
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 bg-secondary text-primary hover:bg-secondary/90 min-h-[44px] font-semibold"
            disabled={submitting}
          >
            <Send className="h-4 w-4" />
            {submitting ? 'שולח...' : 'שלח שאלה'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
