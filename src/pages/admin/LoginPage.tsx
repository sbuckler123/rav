import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loginWithEmail } from '@/api/authApi';
import { useAuth } from '@/auth/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname ?? '/admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const user = await loginWithEmail(email.trim(), password);
      login(user);
      toast.success(`ברוך הבא, ${user.name}`);
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <LogIn className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">כניסה לממשק ניהול</h1>
          <p className="text-sm text-muted-foreground mt-1">אתר הרב קלמן מאיר בר שליט&quot;א</p>
        </div>

        <Card className="shadow-xl border-t-4 border-t-secondary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary">התחברות</CardTitle>
            <CardDescription>הכנס את פרטי הכניסה שלך</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-1.5">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary"
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary"
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                className="w-full min-h-[44px] bg-primary text-white hover:bg-primary/90 gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? 'מתחבר...' : 'כניסה'}
              </Button>

            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          גישה מורשית בלבד
        </p>
      </div>
    </div>
  );
}
