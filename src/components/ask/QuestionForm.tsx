import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { submitQuestion } from '@/api/submitQuestion';
import Turnstile, { isTurnstileEnabled } from '@/components/Turnstile';
import { CheckCircle, Send } from 'lucide-react';

interface Props {
  categories: { name: string }[];
}

export default function QuestionForm({ categories }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [question, setQuestion] = useState('');
  const [allowPublic, setAllowPublic] = useState(true);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const RATE_LIMIT_MS = 60_000; // 1 minute between submissions
  const MAX_NAME_LEN = 100;
  const MAX_QUESTION_LEN = 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !question) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return;
    }
    if (!consent) {
      toast.error('יש לאשר את מדיניות הפרטיות לפני השליחה');
      return;
    }
    if (Date.now() - lastSubmitTime < RATE_LIMIT_MS) {
      toast.error('נא המתן דקה בין שליחת שאלות');
      return;
    }
    if (isTurnstileEnabled && !turnstileToken) {
      toast.error('יש להמתין לסיום בדיקת אבטחה');
      return;
    }
    setSubmitting(true);
    try {
      await submitQuestion({
        name,
        email,
        category: categoryName || undefined,
        topic: categoryName || undefined,
        question,
        allowPublic,
        consent,
        turnstileToken,
      });
      setLastSubmitTime(Date.now());
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
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-9 w-9 text-primary" />
          </div>
          <h3 className="text-xl font-serif font-bold text-primary mb-2">שאלתך נתקבלה!</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6 leading-relaxed">
            תודה על פנייתך. נשיב לשאלתך בהקדם האפשרי.
          </p>
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => { setSubmitted(false); setName(''); setEmail(''); setCategoryName(''); setQuestion(''); setAllowPublic(true); setConsent(false); }}
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
                onChange={e => setName(e.target.value.slice(0, MAX_NAME_LEN))}
                placeholder="שמך המלא"
                maxLength={MAX_NAME_LEN}
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
              <Select value={categoryName} onValueChange={setCategoryName} dir="rtl">
                <SelectTrigger className="min-h-[44px] border border-input bg-white focus:ring-1 focus:border-secondary">
                  <span className={categoryName ? '' : 'text-muted-foreground'}>
                    {categoryName || 'בחר נושא (אופציונלי)'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
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
              onChange={e => setQuestion(e.target.value.slice(0, MAX_QUESTION_LEN))}
              placeholder="פרט את שאלתך כאן..."
              rows={5}
              maxLength={MAX_QUESTION_LEN}
              className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none"
              required
            />
          </div>

          {/* Allow public (optional) */}
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

          {/* Privacy consent (required) */}
          <div className="flex items-start gap-3 p-3.5 bg-white border border-input rounded-lg">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={v => setConsent(v === true)}
              className="mt-0.5"
              required
            />
            <Label htmlFor="consent" className="cursor-pointer text-sm leading-snug text-muted-foreground">
              אני מאשר/ת את איסוף ועיבוד פרטיי (שם, דוא"ל ותוכן השאלה) לצורך מתן מענה,
              בהתאם ל
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary underline underline-offset-2 hover:text-secondary/80 mx-1">
                מדיניות הפרטיות
              </Link>
              <span className="text-destructive">*</span>
            </Label>
          </div>

          {/* Turnstile bot challenge (renders only when site key is configured) */}
          {isTurnstileEnabled && (
            <div className="flex justify-start">
              <Turnstile onToken={setTurnstileToken} />
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2 bg-secondary text-primary hover:bg-secondary/90 min-h-[44px] font-semibold"
            disabled={submitting || !consent || (isTurnstileEnabled && !turnstileToken)}
          >
            <Send className="h-4 w-4" />
            {submitting ? 'שולח...' : 'שלח שאלה'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
