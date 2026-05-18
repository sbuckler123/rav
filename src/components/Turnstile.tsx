/**
 * Cloudflare Turnstile widget — renders an invisible/managed bot challenge.
 *
 * Reads `VITE_TURNSTILE_SITE_KEY` from env. If the key isn't set, the
 * component renders nothing — the calling form treats Turnstile as
 * unconfigured and submits without a token. Once the key is added in Vercel
 * the widget appears and a valid token is required.
 *
 * Usage:
 *   const [token, setToken] = useState<string | null>(null);
 *   <Turnstile onToken={setToken} />
 *   // ... in submit handler, include `token` in the POST body
 */

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileOptions) => string;
      remove: (id: string) => void;
      reset:  (id: string) => void;
    };
  }
}

interface TurnstileOptions {
  sitekey:               string;
  callback?:             (token: string) => void;
  'error-callback'?:     () => void;
  'expired-callback'?:   () => void;
  'timeout-callback'?:   () => void;
  theme?:                'light' | 'dark' | 'auto';
  language?:             string;
  appearance?:           'always' | 'execute' | 'interaction-only';
  size?:                 'normal' | 'flexible' | 'compact';
}

interface Props {
  onToken: (token: string | null) => void;
  className?: string;
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

function ensureScript(): void {
  if (document.querySelector(`script[src*="${SCRIPT_SRC}"]`)) return;
  const s = document.createElement('script');
  s.src = SCRIPT_SRC;
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

export default function Turnstile({ onToken, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef  = useRef<string | null>(null);
  const onTokenRef   = useRef(onToken);
  const siteKey      = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  // Keep the latest callback in a ref so the render effect can stay stable.
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    ensureScript();

    let cancelled = false;
    let pollHandle: number | null = null;

    const tryRender = () => {
      if (cancelled || widgetIdRef.current) return;
      if (window.turnstile && containerRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey:             siteKey,
          theme:               'light',
          language:            'he',
          callback:            (token) => onTokenRef.current(token),
          'expired-callback':  () => onTokenRef.current(null),
          'error-callback':    () => onTokenRef.current(null),
          'timeout-callback':  () => onTokenRef.current(null),
        });
      } else {
        pollHandle = window.setTimeout(tryRender, 150);
      }
    };
    tryRender();

    return () => {
      cancelled = true;
      if (pollHandle !== null) window.clearTimeout(pollHandle);
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className={className} />;
}

/** Whether the Turnstile site key is configured at build time. Forms can use
 *  this to decide whether to require a token before enabling submit. */
export const isTurnstileEnabled = !!(import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined);
