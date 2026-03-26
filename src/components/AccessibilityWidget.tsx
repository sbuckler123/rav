import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TextSize = 'normal' | 'large' | 'xl';

interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  grayscale: boolean;
  reduceMotion: boolean;
  highlightLinks: boolean;
  spacing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'acc-settings';

const DEFAULTS: AccessibilitySettings = {
  textSize: 'normal',
  highContrast: false,
  grayscale: false,
  reduceMotion: false,
  highlightLinks: false,
  spacing: false,
};

const TEXT_SIZE_LABELS: Record<TextSize, { short: string; preview: string }> = {
  normal: { short: 'רגיל',      preview: 'א'  },
  large:  { short: 'גדול',      preview: 'א'  },
  xl:     { short: 'גדול מאוד', preview: 'א'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULTS;
}

function applyToDOM(s: AccessibilitySettings) {
  const cl = document.documentElement.classList;
  cl.remove('acc-text-large', 'acc-text-xl');
  if (s.textSize === 'large') cl.add('acc-text-large');
  if (s.textSize === 'xl')    cl.add('acc-text-xl');
  cl.toggle('acc-high-contrast',  s.highContrast);
  cl.toggle('acc-grayscale',      s.grayscale);
  cl.toggle('acc-reduce-motion',  s.reduceMotion);
  cl.toggle('acc-highlight-links', s.highlightLinks);
  cl.toggle('acc-spacing',        s.spacing);
}

// ─── Toggle sub-component ─────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  id: string;
}

function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-3">
      <label htmlFor={id} className="text-sm font-medium text-primary cursor-pointer select-none flex-1 text-right">
        {label}
      </label>
      {/* dir="ltr" keeps thumb direction consistent regardless of page RTL */}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        dir="ltr"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Accessibility Icon SVG ───────────────────────────────────────────────────

function AccessIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="16" r="10" />
      <path d="M50 28 c-2 0-4 1-5 3 L38 52 c-1 2 0 4 2 5 l10 4 -4 16 c-1 3 1 6 4 7 3 1 6-1 7-4 l5-19 c1-3-1-6-4-7 l-6-2 5-14 c1 0 2 0 3 0 h14 c3 0 5-2 5-5 s-2-5-5-5 H55 l-3-3 c-1-1-2-1-2-1 z" />
      <circle cx="38" cy="78" r="13" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M60 58 c4 2 8 6 10 11" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen]     = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);
  const containerRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyToDOM(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const update = (patch: Partial<AccessibilitySettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  const reset = () => setSettings(DEFAULTS);

  const hasChanges =
    settings.textSize !== 'normal' ||
    settings.highContrast ||
    settings.grayscale ||
    settings.reduceMotion ||
    settings.highlightLinks ||
    settings.spacing;

  return (
    <div
      ref={containerRef}
      dir="rtl"
      style={{ position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 9999, maxWidth: 'calc(100vw - 2rem)' }}
    >
      {/* ── Panel ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="הגדרות נגישות"
          className="w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-white shadow-2xl"
          style={{ position: 'absolute', bottom: 'calc(100% + 0.75rem)', left: 0, maxHeight: 'calc(100svh - 5rem)', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary flex-shrink-0">
                <AccessIcon className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-bold text-primary">הגדרות נגישות</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="סגור פאנל נגישות"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="space-y-4 p-4">

            {/* ── Text size ── */}
            <section aria-labelledby="acc-text-size-label">
              <p id="acc-text-size-label" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                גודל טקסט
              </p>
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-labelledby="acc-text-size-label">
                {(['normal', 'large', 'xl'] as TextSize[]).map(size => {
                  const active = settings.textSize === size;
                  const previewSizes = { normal: 'text-sm', large: 'text-base', xl: 'text-xl' };
                  return (
                    <button
                      key={size}
                      onClick={() => update({ textSize: size })}
                      aria-pressed={active}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all ${
                        active
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted'
                      }`}
                    >
                      <span className={`font-bold leading-none ${previewSizes[size]}`} aria-hidden="true">
                        {TEXT_SIZE_LABELS[size].preview}
                      </span>
                      <span className="text-[10px] leading-none">
                        {TEXT_SIZE_LABELS[size].short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* ── Toggles ── */}
            <section aria-label="אפשרויות תצוגה" className="space-y-0.5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                תצוגה
              </p>
              <Toggle
                id="acc-toggle-contrast"
                label="ניגודיות גבוהה"
                checked={settings.highContrast}
                onChange={() => update({ highContrast: !settings.highContrast })}
              />
              <Toggle
                id="acc-toggle-grayscale"
                label="גווני אפור"
                checked={settings.grayscale}
                onChange={() => update({ grayscale: !settings.grayscale })}
              />
              <Toggle
                id="acc-toggle-links"
                label="הדגש קישורים"
                checked={settings.highlightLinks}
                onChange={() => update({ highlightLinks: !settings.highlightLinks })}
              />
            </section>

            <div className="border-t border-border" />

            {/* ── Reading toggles ── */}
            <section aria-label="אפשרויות קריאה" className="space-y-0.5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                קריאה
              </p>
              <Toggle
                id="acc-toggle-spacing"
                label="רווח מוגדל"
                checked={settings.spacing}
                onChange={() => update({ spacing: !settings.spacing })}
              />
              <Toggle
                id="acc-toggle-motion"
                label="הפחת אנימציות"
                checked={settings.reduceMotion}
                onChange={() => update({ reduceMotion: !settings.reduceMotion })}
              />
            </section>

            {/* ── Reset ── */}
            {hasChanges && (
              <>
                <div className="border-t border-border" />
                <button
                  onClick={reset}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/40 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6 2l2-2M6 2l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  איפוס הגדרות
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'סגור הגדרות נגישות' : 'פתח הגדרות נגישות'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          isOpen ? 'bg-primary/90 scale-95' : 'bg-primary hover:scale-105 hover:shadow-2xl'
        }`}
      >
        {hasChanges && !isOpen && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-secondary"
          />
        )}
        <AccessIcon className="h-9 w-9 text-white" />
      </button>
    </div>
  );
}
