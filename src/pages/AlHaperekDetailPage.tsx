import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X, Share2, CalendarDays, FileDown, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import SEO from '@/components/SEO';
import { getAlHaperekItem, type AlHaperekItem, type ContentBlock } from '@/api/getAlHaperek';
import { useAlHaperek } from '@/hooks/useQueries';

// ── YouTube helpers ──────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── Block renderers ──────────────────────────────────────────────────────────

function TextBlock({ block }: { block: Extract<ContentBlock, { type: 'text' }> }) {
  return (
    <div className="prose prose-lg max-w-none text-right" dir="rtl">
      {block.content.split('\n').filter(l => l.trim()).map((paragraph, i) => (
        <p key={i} className="text-base md:text-lg leading-[1.85] text-foreground mb-4 whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function VideoBlock({ block }: { block: Extract<ContentBlock, { type: 'video' }> }) {
  const videoId = extractYouTubeId(block.url);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}`
    : block.url;

  return (
    <figure className="w-full">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-md bg-black">
        <iframe
          src={embedUrl}
          title={block.caption ?? 'סרטון'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function ImagesBlock({
  block,
  onOpenLightbox,
  baseIndex,
}: {
  block: Extract<ContentBlock, { type: 'images' }>;
  onOpenLightbox: (idx: number) => void;
  baseIndex: number;
}) {
  const count = block.urls.length;
  const gridClass =
    count === 1 ? 'grid-cols-1' :
    count === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    'grid-cols-2 sm:grid-cols-3';

  return (
    <figure className="w-full">
      <div className={`grid ${gridClass} gap-2 sm:gap-3`}>
        {block.urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onOpenLightbox(baseIndex + i)}
            className={`group rounded-xl overflow-hidden border border-border hover:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary transition-colors w-full ${count > 1 ? 'aspect-[4/3]' : ''}`}
            aria-label={`פתח תמונה ${i + 1}`}
          >
            <img
              src={url}
              alt={block.caption ?? `תמונה ${i + 1}`}
              className={`w-full group-hover:scale-[1.02] transition-transform duration-200 ${count === 1 ? 'h-auto max-h-[600px] object-contain' : 'h-full object-cover'}`}
            />
          </button>
        ))}
      </div>
      {block.caption && (
        <figcaption className="mt-3 text-sm text-muted-foreground text-center">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function PdfBlock({ block }: { block: Extract<ContentBlock, { type: 'pdf' }> }) {
  const [loaded, setLoaded] = useState(false);
  const label = block.label || 'PDF';

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-3 bg-[#F7F4EE] px-4 py-3">
        <div className="w-9 h-9 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileDown className="h-4 w-4 text-red-500" />
        </div>
        <p className="font-semibold text-primary text-sm flex-1 truncate">{label}</p>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors min-h-[36px]"
          >
            <ExternalLink className="h-3 w-3" />
            פתח
          </a>
          <a
            href={block.url}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-primary text-xs font-medium hover:bg-secondary/90 transition-colors min-h-[36px]"
          >
            <FileDown className="h-3 w-3" />
            הורד
          </a>
        </div>
      </div>

      {/* Embedded viewer — direct URL, native browser PDF renderer */}
      <div className="relative w-full bg-muted/30 h-[60vh] sm:h-[750px]">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">טוען מסמך...</span>
          </div>
        )}
        <iframe
          src={block.url}
          title={label}
          onLoad={() => setLoaded(true)}
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent(c => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') prev();
      if (e.key === 'ArrowLeft') next();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Close */}
      <button className="absolute top-4 left-4 text-white p-2.5 hover:bg-white/20 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={onClose} aria-label="סגור">
        <X className="h-6 w-6" />
      </button>

      {/* Image */}
      <div className="max-w-4xl w-full flex-1 flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img
          src={images[current]}
          alt={`תמונה ${current + 1}`}
          className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg mx-auto"
        />
      </div>

      {/* Counter + arrows row — always visible at bottom */}
      {images.length > 1 && (
        <div className="flex items-center gap-6 mt-4 pb-2" onClick={e => e.stopPropagation()}>
          <button className="text-white p-2.5 hover:bg-white/20 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={prev} aria-label="תמונה קודמת">
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="text-white text-sm opacity-70 min-w-[48px] text-center">{current + 1} / {images.length}</span>
          <button className="text-white p-2.5 hover:bg-white/20 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={next} aria-label="תמונה הבאה">
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function formatDate(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AlHaperekDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<AlHaperekItem | null | undefined>(undefined);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const { data: listData } = useAlHaperek();
  const allItems = listData?.items ?? [];
  const currentIdx = allItems.findIndex(i => i.linkId === id);
  const prevItem = currentIdx !== -1 ? (allItems[currentIdx + 1] ?? null) : null;
  const nextItem = currentIdx !== -1 ? (allItems[currentIdx - 1] ?? null) : null;

  useEffect(() => {
    if (!id) { setItem(null); return; }
    getAlHaperekItem(id).then(setItem).catch(() => setItem(null));
  }, [id]);

  // Flatten all image URLs across all image blocks for the lightbox
  const allImages = item?.blocks.flatMap(b => b.type === 'images' ? b.urls : []) ?? [];

  function openLightbox(globalIdx: number) {
    setLightboxImages(allImages);
    setLightboxIdx(globalIdx);
  }

  if (item === undefined) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-20 text-center text-muted-foreground">
        טוען...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-16 text-center">
        <p className="text-muted-foreground mb-4">הפריט לא נמצא</p>
        <Button asChild variant="outline"><Link to="/al-haperek">חזרה לעל הפרק</Link></Button>
      </div>
    );
  }

  // Calculate image base indices for lightbox
  let imageCounter = 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={item.title} description={item.summary ?? `${item.title} — הרב קלמן מאיר בר`} />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-8">
        <Breadcrumbs
          items={[
            { label: 'דף הבית', href: '/' },
            { label: 'על הפרק', href: '/al-haperek' },
            { label: item.title },
          ]}
        />

        {/* Header */}
        <header className="mt-8 mb-8">
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-primary leading-snug mb-3">
            {item.title}
          </h1>
          {item.date && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {formatDate(item.date)}
            </p>
          )}
          {item.summary && (
            <p className="mt-3 text-base text-muted-foreground leading-relaxed border-r-4 border-secondary pr-4 bg-secondary/5 py-3 rounded-r-xl">
              {item.summary}
            </p>
          )}
          <div className="w-20 h-1 rounded-full bg-secondary mt-5" aria-hidden />
        </header>

        {/* Content blocks */}
        <div className="space-y-8">
          {item.blocks.map((block, idx) => {
            if (block.type === 'text') {
              return <TextBlock key={idx} block={block} />;
            }
            if (block.type === 'video') {
              return <VideoBlock key={idx} block={block} />;
            }
            if (block.type === 'images') {
              const baseIdx = imageCounter;
              imageCounter += block.urls.length;
              return (
                <ImagesBlock
                  key={idx}
                  block={block}
                  onOpenLightbox={openLightbox}
                  baseIndex={baseIdx}
                />
              );
            }
            if (block.type === 'pdf') {
              return <PdfBlock key={idx} block={block} />;
            }
            return null;
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-10 pt-6 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.share) navigator.share({ title: item.title, url: window.location.href });
              else navigator.clipboard.writeText(window.location.href).then(() => alert('הקישור הועתק!'));
            }}
          >
            <Share2 className="h-4 w-4 ml-2" />
            שתף
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/al-haperek">חזרה לרשימה</Link>
          </Button>
        </div>

        {/* Prev / Next navigation */}
        {(prevItem || nextItem) && (
          <nav
            className="flex items-center justify-between gap-4 mt-8 py-6 px-5 rounded-xl border border-border"
            style={{ backgroundColor: '#FAF8F2' }}
            aria-label="ניווט בין פריטים"
          >
            <div className="flex-1 min-w-0 text-left">
              {prevItem && (
                <Link to={`/al-haperek/${prevItem.linkId}`} className="group block hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors">
                  <span className="text-xs text-muted-foreground block">→ הקודם</span>
                  <span className="font-semibold text-primary group-hover:text-secondary text-sm line-clamp-1">{prevItem.title}</span>
                </Link>
              )}
            </div>
            <div className="flex-1 min-w-0 text-right">
              {nextItem && (
                <Link to={`/al-haperek/${nextItem.linkId}`} className="group block hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors">
                  <span className="text-xs text-muted-foreground block">הבא ←</span>
                  <span className="font-semibold text-primary group-hover:text-secondary text-sm line-clamp-1">{nextItem.title}</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImages.length > 0 && (
        <Lightbox images={lightboxImages} index={lightboxIdx} onClose={() => setLightboxImages([])} />
      )}
    </div>
  );
}
