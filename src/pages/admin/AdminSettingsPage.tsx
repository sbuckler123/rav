import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/apiFetch';
import { Settings, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NotificationSettings {
  notifyEnabled:   boolean;
  notifyEmail:     string;
  notifyFromEmail: string;
}

const DEFAULT: NotificationSettings = {
  notifyEnabled:   false,
  notifyEmail:     '',
  notifyFromEmail: '',
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState<NotificationSettings>(DEFAULT);

  useEffect(() => {
    apiFetch('/api/admin?section=settings')
      .then((data: unknown) => setForm(data as NotificationSettings))
      .catch(() => toast.error('שגיאה בטעינת הגדרות'))
      .finally(() => setLoading(false));
  }, []);

  function field<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.notifyEnabled && !form.notifyEmail.trim()) {
      toast.error('יש להזין כתובת אימייל לקבלת התראות');
      return;
    }
    if (form.notifyEnabled && !form.notifyFromEmail.trim()) {
      toast.error('יש להזין כתובת שולח');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/admin?section=settings', {
        method: 'PATCH',
        body:   JSON.stringify(form),
      });
      toast.success('הגדרות נשמרו בהצלחה');
    } catch {
      toast.error('שגיאה בשמירת הגדרות');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-6 w-6 text-secondary flex-shrink-0" />
        <h1 className="text-2xl font-bold text-primary">הגדרות</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Email notifications card */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/30">
            <Bell className="h-4 w-4 text-secondary flex-shrink-0" />
            <h2 className="font-semibold text-primary text-sm">התראות אימייל</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Enable toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm text-primary">שלח הודעה בשאלה חדשה</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  קבל אימייל כאשר מתקבלת שאלה חדשה מהאתר
                </p>
              </div>
              {/* Toggle — dir=ltr so Tailwind after:translate-x works correctly in RTL layout */}
              <label dir="ltr" className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.notifyEnabled}
                  onChange={e => field('notifyEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-secondary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Email fields — fade when disabled */}
            <div
              className={`space-y-4 transition-opacity duration-200 ${
                form.notifyEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none select-none'
              }`}
            >
              <div className="space-y-1.5">
                <Label htmlFor="notifyEmail">כתובת אימייל לקבלת התראות</Label>
                <Input
                  id="notifyEmail"
                  type="email"
                  dir="ltr"
                  placeholder="rabbi@example.com"
                  value={form.notifyEmail}
                  onChange={e => field('notifyEmail', e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notifyFromEmail">כתובת שולח (From)</Label>
                <Input
                  id="notifyFromEmail"
                  type="email"
                  dir="ltr"
                  placeholder="notifications@yourdomain.com"
                  value={form.notifyFromEmail}
                  onChange={e => field('notifyFromEmail', e.target.value)}
                  className="h-10"
                />
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 leading-relaxed">
                  <strong>שים לב:</strong> כתובת השולח חייבת להיות מדומיין מאומת ב-Resend.{' '}
                  לפני אימות דומיין, ניתן להשתמש ב-
                  <span dir="ltr" className="font-mono bg-amber-100 px-1 rounded mx-1">onboarding@resend.dev</span>
                  — אך אז ניתן לשלוח רק לכתובת האימייל של חשבון ה-Resend.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-[130px] h-10">
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : 'שמור הגדרות'}
          </Button>
        </div>
      </form>
    </div>
  );
}
