import * as Sentry from '@sentry/node';

let initialized = false;

function init() {
  if (initialized || !process.env.SENTRY_DSN) return;
  initialized = true;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? 'development',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        delete h['authorization'];
        delete h['Authorization'];
        delete h['cookie'];
      }
      return event;
    },
  });
}

/**
 * Capture a server-side error with structured context.
 * Always emits a console.error line visible in Vercel runtime logs.
 */
export function captureServerError(
  err: unknown,
  ctx: Record<string, string | number | boolean | undefined>,
) {
  init();
  Sentry.withScope(scope => {
    Object.entries(ctx).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
  });
  console.error('[error]', JSON.stringify({
    ...ctx,
    message: err instanceof Error ? err.message : String(err),
  }));
}
