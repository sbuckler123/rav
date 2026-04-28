import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        delete h['authorization'];
        delete h['Authorization'];
      }
      return event;
    },
  });
}

export function setSentryUser(
  user: { id: string; email: string; name: string; role: string } | null,
) {
  Sentry.setUser(
    user
      ? { id: user.id, email: user.email, username: user.name, role: user.role }
      : null,
  );
}

export function captureApiError(
  error: Error,
  ctx: { url: string; method: string; status?: number; response?: unknown },
) {
  Sentry.withScope(scope => {
    scope.setTag('type', 'api_error');
    scope.setTag('status', String(ctx.status ?? 'network'));
    scope.setExtra('url', ctx.url);
    scope.setExtra('method', ctx.method);
    if (ctx.response !== undefined) scope.setExtra('response', ctx.response);
    Sentry.captureException(error);
  });
}

export function captureUploadError(
  error: Error,
  ctx: { fileType: 'image' | 'pdf'; fileName: string; fileSize: number; detail?: unknown },
) {
  Sentry.withScope(scope => {
    scope.setTag('type', 'cloudinary_upload');
    scope.setExtra('fileType', ctx.fileType);
    scope.setExtra('fileName', ctx.fileName);
    scope.setExtra('fileSize', ctx.fileSize);
    if (ctx.detail !== undefined) scope.setExtra('cloudinaryResponse', ctx.detail);
    Sentry.captureException(error);
  });
}
