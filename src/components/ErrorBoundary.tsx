import * as Sentry from '@sentry/react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Fallback({ resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <AlertTriangle className="h-10 w-10 text-destructive/60" />
      <h2 className="text-xl font-semibold text-primary">אירעה שגיאה</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        משהו השתבש. ניתן לנסות שוב או לחזור לדף הבית.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="outline" onClick={resetError}>נסה שוב</Button>
        <Button onClick={() => { window.location.href = '/'; }}>דף הבית</Button>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <Fallback error={error as Error} resetError={resetError} />
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
