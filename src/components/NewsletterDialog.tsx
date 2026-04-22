import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterDialog({ open, onOpenChange }: NewsletterDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEmail('');
      setName('');
      setStatus('idle');
      setErrorMsg('');
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setErrorMsg('נא להזין כתובת דוא"ל תקינה');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    await new Promise((r) => setTimeout(r, 600));
    setStatus('success');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative" dir="rtl">
        <DialogClose onClose={handleClose} />

        {status === 'success' ? (
          <div className="py-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-secondary" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">תודה שנרשמת!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              נעדכן אותך במייל על שיעורים, מאמרים ופסקי הלכה חדשים.
            </p>
            <Button onClick={handleClose} className="min-h-[44px]">סגור</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <DialogTitle>הצטרפות לניוזלטר</DialogTitle>
              </div>
              <DialogDescription>
                קבלו עדכונים על שיעורים חדשים, פסקי הלכה ומאמרים של הרב.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="newsletter-name" className="block text-sm font-medium text-primary mb-1.5">
                  שם (אופציונלי)
                </label>
                <Input
                  id="newsletter-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="השם שלך"
                  className="min-h-[44px]"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="newsletter-email" className="block text-sm font-medium text-primary mb-1.5">
                  דוא"ל <span className="text-red-500">*</span>
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  placeholder="your@email.com"
                  className="min-h-[44px]"
                  autoComplete="email"
                  dir="ltr"
                  aria-invalid={status === 'error'}
                  aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                />
                {status === 'error' && errorMsg && (
                  <p id="newsletter-error" className="mt-1.5 text-sm text-red-600">{errorMsg}</p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="min-h-[44px]"
                  disabled={status === 'submitting'}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  className="min-h-[44px] bg-secondary text-primary hover:bg-secondary/90"
                  disabled={status === 'submitting' || !email}
                >
                  {status === 'submitting' ? 'שולח...' : 'הרשמה'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
