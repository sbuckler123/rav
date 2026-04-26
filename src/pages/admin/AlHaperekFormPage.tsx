import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/apiFetch';
import { QUERY_KEYS } from '@/hooks/useQueries';
import { uploadToCloudinary, uploadToCloudinaryFile } from '@/api/cloudinary';
import ImageUpload from '@/components/admin/ImageUpload';
import {
  ArrowRight, Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown,
  FileText, Video, Images, FileDown, GripVertical, X, Check, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ContentBlock } from '@/api/getAlHaperek';

// ── Block type config ─────────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type: 'text'   as const, label: 'טקסט',    icon: FileText, color: 'text-blue-600'  },
  { type: 'video'  as const, label: 'וידאו',   icon: Video,    color: 'text-red-600'   },
  { type: 'images' as const, label: 'תמונות',  icon: Images,   color: 'text-green-600' },
  { type: 'pdf'    as const, label: 'PDF',      icon: FileDown, color: 'text-orange-600'},
];

function blockIcon(type: ContentBlock['type']) {
  const cfg = BLOCK_TYPES.find(b => b.type === type);
  if (!cfg) return null;
  const Icon = cfg.icon;
  return <Icon className={`h-4 w-4 ${cfg.color}`} />;
}

function blockLabel(type: ContentBlock['type']) {
  return BLOCK_TYPES.find(b => b.type === type)?.label ?? type;
}

function blockPreview(block: ContentBlock): string {
  if (block.type === 'text')   return block.content.slice(0, 80) + (block.content.length > 80 ? '…' : '');
  if (block.type === 'video')  return block.url;
  if (block.type === 'images') return `${block.urls.length} תמונות${block.caption ? ` — ${block.caption}` : ''}`;
  if (block.type === 'pdf')    return block.label ?? block.url.split('/').pop() ?? 'PDF';
  return '';
}

function newBlock(type: ContentBlock['type']): ContentBlock {
  if (type === 'text')   return { type, content: '' };
  if (type === 'video')  return { type, url: '', caption: '' };
  if (type === 'images') return { type, urls: [], caption: '' };
  return { type: 'pdf', url: '', label: '' };
}

// ── Individual block editors ──────────────────────────────────────────────────

function TextEditor({ block, onChange }: { block: Extract<ContentBlock, { type: 'text' }>; onChange: (b: ContentBlock) => void }) {
  return (
    <Textarea
      value={block.content}
      onChange={e => onChange({ ...block, content: e.target.value })}
      placeholder="הכנס טקסט כאן... (שורות חדשות נשמרות)"
      rows={6}
      className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none text-sm font-sans"
      dir="rtl"
    />
  );
}

function VideoEditor({ block, onChange }: { block: Extract<ContentBlock, { type: 'video' }>; onChange: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-2">
      <Input
        value={block.url}
        onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder="https://www.youtube.com/watch?v=..."
        dir="ltr"
        className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary text-sm"
      />
      <Input
        value={block.caption ?? ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="כיתוב (אופציונלי)"
        className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary text-sm"
      />
    </div>
  );
}

function ImagesEditor({ block, onChange }: { block: Extract<ContentBlock, { type: 'images' }>; onChange: (b: ContentBlock) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange({ ...block, urls: [...block.urls, url] });
    } catch {
      toast.error('שגיאה בהעלאת תמונה');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    onChange({ ...block, urls: block.urls.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-3">
      {/* Existing images */}
      {block.urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {block.urls.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden aspect-square border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload new */}
      <label className={cn(
        'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors min-h-[80px]',
        uploading ? 'border-secondary/50 bg-secondary/5 pointer-events-none' : 'border-border hover:border-secondary/50 hover:bg-muted/20'
      )}>
        <input type="file" accept="image/*" className="hidden" disabled={uploading}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        {uploading
          ? <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">מעלה...</span></>
          : <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">הוסף תמונה</span></>
        }
      </label>

      <Input
        value={block.caption ?? ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="כיתוב לגלריה (אופציונלי)"
        className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary text-sm"
      />
    </div>
  );
}

function PdfEditor({ block, onChange }: { block: Extract<ContentBlock, { type: 'pdf' }>; onChange: (b: ContentBlock) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadToCloudinaryFile(file);
      onChange({ ...block, url, label: block.label || file.name.replace(/\.pdf$/i, '') });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה בהעלאת קובץ';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {block.url ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <FileDown className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-800 truncate flex-1" dir="ltr">{block.url.split('/').pop()}</span>
          <button type="button" onClick={() => onChange({ ...block, url: '' })} className="text-green-600 hover:text-red-500 transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className={cn(
          'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors min-h-[80px]',
          uploading ? 'border-secondary/50 bg-secondary/5 pointer-events-none' : 'border-border hover:border-secondary/50 hover:bg-muted/20'
        )}>
          <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">מעלה...</span></>
            : <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">העלה קובץ PDF</span></>
          }
        </label>
      )}
      <Input
        value={block.label ?? ''}
        onChange={e => onChange({ ...block, label: e.target.value })}
        placeholder="שם המסמך (יוצג למשתמש)"
        className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary text-sm"
      />
    </div>
  );
}

// ── Block row ─────────────────────────────────────────────────────────────────

function BlockRow({
  block, idx, total, editing, onEdit, onCancel,
  onChange, onMove, onDelete,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  block: ContentBlock;
  idx: number;
  total: number;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onChange: (b: ContentBlock) => void;
  onMove: (dir: 'up' | 'down') => void;
  onDelete: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'rounded-xl border bg-white transition-all',
        isDragging   && 'opacity-40 scale-[0.99]',
        isDragOver   && 'border-secondary border-2 bg-secondary/5',
        !isDragging && !isDragOver && (editing ? 'border-secondary shadow-sm' : 'border-border hover:border-border/80'),
      )}
    >
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {blockIcon(block.type)}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">
            {blockLabel(block.type)}
          </span>
          {!editing && (
            <span className="text-sm text-foreground/70 truncate">{blockPreview(block)}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" disabled={idx === 0} onClick={() => onMove('up')}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-30">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" disabled={idx === total - 1} onClick={() => onMove('down')}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-30">
            <ChevronDown className="h-4 w-4" />
          </button>
          {editing ? (
            <button type="button" onClick={onCancel} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
              <Check className="h-4 w-4 text-green-600" />
            </button>
          ) : (
            <button type="button" onClick={onEdit} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
              <FileText className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={onDelete}
            className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor (when expanded) */}
      {editing && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          {block.type === 'text'   && <TextEditor   block={block} onChange={onChange} />}
          {block.type === 'video'  && <VideoEditor  block={block} onChange={onChange} />}
          {block.type === 'images' && <ImagesEditor block={block} onChange={onChange} />}
          {block.type === 'pdf'    && <PdfEditor    block={block} onChange={onChange} />}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  linkId: string;
  summary: string;
  coverImage: string;
  date: string;
  tags: string;
  status: 'פורסם' | 'טיוטה';
}

const EMPTY_FORM: FormState = {
  title: '', linkId: '', summary: '', coverImage: '',
  date: '', tags: '', status: 'טיוטה',
};

export default function AlHaperekFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    apiFetch<{
      id: string; title: string; linkId: string; summary: string; coverImage: string;
      date: string; tags: string[]; status: string; blocks: ContentBlock[];
    }>(`/api/admin?section=al-haperek&id=${id}`)
      .then(data => {
        setForm({
          title: data.title,
          linkId: data.linkId,
          summary: data.summary,
          coverImage: data.coverImage,
          date: data.date,
          tags: data.tags.join(', '),
          status: data.status === 'פורסם' ? 'פורסם' : 'טיוטה',
        });
        setBlocks(data.blocks ?? []);
      })
      .catch(() => toast.error('שגיאה בטעינת הנתונים'))
      .finally(() => setLoading(false));
  }, [id]);

  function field<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function addBlock(type: ContentBlock['type']) {
    const nb = newBlock(type);
    setBlocks(prev => [...prev, nb]);
    setEditingIdx(blocks.length);
    setShowBlockPicker(false);
  }

  function updateBlock(idx: number, block: ContentBlock) {
    setBlocks(prev => prev.map((b, i) => i === idx ? block : b));
  }

  function moveBlock(idx: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    setBlocks(next);
    if (editingIdx === idx) setEditingIdx(target);
  }

  function deleteBlock(idx: number) {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
    else if (editingIdx !== null && editingIdx > idx) setEditingIdx(editingIdx - 1);
  }

  function handleDrop(targetIdx: number) {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const next = [...blocks];
    const [moved] = next.splice(draggedIdx, 1);
    next.splice(targetIdx, 0, moved);
    setBlocks(next);
    if (editingIdx === draggedIdx) setEditingIdx(targetIdx);
    setDraggedIdx(null);
    setDragOverIdx(null);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('כותרת היא שדה חובה'); return; }
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const body = {
        title:      form.title.trim(),
        linkId:     form.linkId.trim() || undefined,
        summary:    form.summary.trim(),
        coverImage: form.coverImage.trim(),
        date:       form.date || undefined,
        tags,
        status:     form.status,
        blocks,
      };

      if (isEdit) {
        await apiFetch(`/api/admin?section=al-haperek&id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        toast.success('הפריט עודכן');
      } else {
        await apiFetch('/api/admin?section=al-haperek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        toast.success('הפריט נוסף');
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alHaperek });
      navigate('/admin/al-haperek');
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
          <Link to="/admin/al-haperek">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Link>
        </Button>
        <div className="w-px h-5 bg-border" />
        <h1 className="text-xl font-bold text-primary flex-1">{isEdit ? 'עריכת פריט' : 'פריט חדש'}</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'שומר...' : 'שמור'}
        </Button>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-6">

        {/* ── Metadata sidebar ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">פרטי הפריט</p>

            <div className="space-y-1.5">
              <Label>כותרת *</Label>
              <Input value={form.title} onChange={e => field('title', e.target.value)}
                placeholder="כותרת הפריט"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>סטטוס</Label>
              <div className="flex gap-2">
                {(['פורסם', 'טיוטה'] as const).map(s => (
                  <button key={s} type="button" onClick={() => field('status', s)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                      form.status === s
                        ? s === 'פורסם' ? 'bg-green-600 text-white border-green-600' : 'bg-primary text-white border-primary'
                        : 'bg-white text-muted-foreground border-border hover:border-primary'
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>תאריך פרסום</Label>
              <Input type="date" value={form.date} onChange={e => field('date', e.target.value)} dir="ltr"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>תגיות</Label>
              <Input value={form.tags} onChange={e => field('tags', e.target.value)}
                placeholder="מכתב לציבור, פסיקת השעה, ..."
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
              <p className="text-xs text-muted-foreground">הפרד בפסיקים</p>
            </div>

            <div className="space-y-1.5">
              <Label>תקציר</Label>
              <Textarea value={form.summary} onChange={e => field('summary', e.target.value)}
                placeholder="תיאור קצר שיופיע בכרטיס ברשימה..." rows={3}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none" />
            </div>

            <div className="space-y-1.5">
              <Label>תמונת כותרת</Label>
              <ImageUpload
                value={form.coverImage || undefined}
                onUpload={url => field('coverImage', url)}
                onClear={() => field('coverImage', '')}
              />
            </div>

            {isEdit && (
              <div className="space-y-1.5">
                <Label>מזהה קישור</Label>
                <Input value={form.linkId} onChange={e => field('linkId', e.target.value)}
                  placeholder="auto-generated" dir="ltr"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary font-mono text-sm" />
              </div>
            )}
          </div>
        </div>

        {/* ── Block builder ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                בלוקי תוכן
                {blocks.length > 0 && <span className="mr-1.5 text-primary font-bold">({blocks.length})</span>}
              </p>
              <p className="text-xs text-muted-foreground">הבלוקים מוצגים בסדר זה לגולש</p>
            </div>

            {/* Empty state */}
            {blocks.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-border py-12 text-center mb-4">
                <GripVertical className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">אין בלוקי תוכן עדיין</p>
                <p className="text-xs text-muted-foreground/60 mt-1">לחץ "+ הוסף בלוק" להתחיל</p>
              </div>
            )}

            {/* Block list */}
            <div className="space-y-2 mb-4">
              {blocks.map((block, idx) => (
                <BlockRow
                  key={idx}
                  block={block}
                  idx={idx}
                  total={blocks.length}
                  editing={editingIdx === idx}
                  onEdit={() => setEditingIdx(editingIdx === idx ? null : idx)}
                  onCancel={() => setEditingIdx(null)}
                  onChange={b => updateBlock(idx, b)}
                  onMove={dir => moveBlock(idx, dir)}
                  onDelete={() => deleteBlock(idx)}
                  isDragging={draggedIdx === idx}
                  isDragOver={dragOverIdx === idx && draggedIdx !== idx}
                  onDragStart={() => setDraggedIdx(idx)}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                />
              ))}
            </div>

            {/* Add block */}
            {showBlockPicker ? (
              <div className="rounded-xl border border-dashed border-secondary/50 bg-secondary/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-primary">בחר סוג בלוק</p>
                  <button type="button" onClick={() => setShowBlockPicker(false)} className="text-muted-foreground hover:text-primary">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BLOCK_TYPES.map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addBlock(type)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-white hover:border-secondary hover:bg-secondary/5 transition-all"
                    >
                      <Icon className={`h-6 w-6 ${color}`} />
                      <span className="text-xs font-medium text-primary">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBlockPicker(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all min-h-[52px]"
              >
                <Plus className="h-4 w-4" />
                הוסף בלוק
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
