import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Video, Plus, Pencil, Trash2, Loader2, Search, Youtube } from 'lucide-react';
import { airtableFetch, airtableCreate, airtableUpdate, airtableDelete } from '@/api/airtable';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

interface AdminVideo {
  id: string;
  title: string;
  dateRaw: string;
  dateDisplay: string;
  duration: string;
  description: string;
  category: string;
  videoType: string;
  youtubeId: string;
  videoUrl: string;
  thumbnail: string;
  views: number;
  isNew: boolean;
  linkId: string;
  createdByName: string;
  updatedByName: string;
}

interface FormState {
  title: string;
  date: string;
  duration: string;
  description: string;
  category: string;
  youtubeId: string;
  views: string;
  isNew: boolean;
}

const EMPTY_FORM: FormState = {
  title: '', date: '', duration: '', description: '', category: '',
  youtubeId: '',
  views: '', isNew: false,
};

function extractField(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value != null) return String(val.value).trim();
  return '';
}

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

async function fetchVideos(userRecords: any[] = []): Promise<AdminVideo[]> {
  const data = await airtableFetch('שיעורי וידאו', {}, [{ field: 'תאריך', direction: 'desc' }]);
  const getUserName = (ids: any) => {
    if (!Array.isArray(ids) || !ids.length) return '';
    return userRecords.find((r: any) => r.id === ids[0])?.fields['שם'] ?? '';
  };
  return data.records.map((r: any) => {
    const f = r.fields;
    const dateRaw = f['תאריך'] ?? '';
    return {
      id: r.id,
      title: f['כותרת'] ?? '',
      dateRaw: dateRaw ? dateRaw.split('T')[0] : '',
      dateDisplay: formatDisplay(dateRaw),
      duration: f['משך'] ?? '',
      description: extractField(f['תיאור']),
      category: f['קטגוריה'] ?? '',
      videoType: f['סוג סרטון'] ?? 'youtube',
      youtubeId: (f['מזהה יוטיוב'] ?? '').split('&')[0].split('?')[0].trim(),
      videoUrl: f['קישור סרטון'] ?? '',
      thumbnail: f['תמונה ממוזערת'] ?? '',
      views: f['צפיות'] ?? 0,
      isNew: f['חדש'] ?? false,
      linkId: extractField(f['מזהה קישור']),
      createdByName: getUserName(f['נוצר על ידי']),
      updatedByName: getUserName(f['עודכן על ידי']),
    };
  });
}

function getThumb(v: AdminVideo): string {
  if (v.thumbnail) return v.thumbnail;
  if (v.youtubeId) return `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`;
  return '';
}

export default function AdminVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVideo | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminVideo | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    airtableFetch('משתמשים')
      .then(usersData => fetchVideos(usersData.records ?? []))
      .then(setVideos)
      .catch(() => toast.error('שגיאה בטעינת שיעורי וידאו'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(v: AdminVideo) {
    setEditing(v);
    setForm({
      title: v.title,
      date: v.dateRaw,
      duration: v.duration,
      description: v.description,
      category: v.category,
      youtubeId: v.youtubeId,
      views: v.views > 0 ? String(v.views) : '',
      isNew: v.isNew,
    });
    setDialogOpen(true);
  }

  function field<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        'כותרת': form.title.trim(),
        'חדש': form.isNew,
      };
      if (form.date)              fields['תאריך']            = form.date;
      if (form.duration.trim())   fields['משך']              = form.duration.trim();
      if (form.description.trim()) fields['תיאור']           = form.description.trim();
      if (form.category.trim())   fields['קטגוריה']          = form.category.trim();
      fields['סוג סרטון'] = 'youtube';
      if (form.youtubeId.trim())  fields['מזהה יוטיוב'] = form.youtubeId.trim();
      const viewsParsed = parseInt(form.views);
      if (!isNaN(viewsParsed))    fields['צפיות']            = viewsParsed;

      if (user?.id) fields['עודכן על ידי'] = [user.id];

      if (editing) {
        await airtableUpdate('שיעורי וידאו', editing.id, fields);
        toast.success('השיעור עודכן');
      } else {
        if (user?.id) fields['נוצר על ידי'] = [user.id];
        await airtableCreate('שיעורי וידאו', fields);
        toast.success('השיעור נוסף');
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await airtableDelete('שיעורי וידאו', deleteTarget.id);
      toast.success('השיעור נמחק');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = videos.filter(v =>
    !search || v.title.includes(search) || v.category.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Video className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-primary">שיעורי וידאו</h1>
          <p className="text-sm text-muted-foreground">{videos.length} שיעורים</p>
        </div>
        <Button
          onClick={openAdd}
          className="inline-flex items-center gap-2 h-11 bg-secondary text-primary hover:bg-secondary/90 flex-shrink-0"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">שיעור חדש</span>
          <span className="sm:hidden">חדש</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי כותרת או קטגוריה..."
          className="pr-9 border border-input bg-white"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 px-5 flex items-center gap-3">
                <div className="h-10 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-48" />
                <div className="h-4 bg-muted animate-pulse rounded w-20 mr-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">לא נמצאו שיעורים</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(v => {
              const thumb = getThumb(v);
              return (
                <div key={v.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/30 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {thumb
                      ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Video className="h-4 w-4 text-muted-foreground" /></div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary truncate text-sm">{v.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {v.dateDisplay && <span className="text-xs text-muted-foreground">{v.dateDisplay}</span>}
                      {v.duration && <span className="text-xs text-muted-foreground hidden sm:inline">· {v.duration}</span>}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {v.isNew && <Badge className="bg-red-100 text-red-700 border-red-200 text-xs hidden sm:inline-flex">חדש</Badge>}
                    {v.category && <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{v.category}</Badge>}
                    <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(v)}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(v)}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="relative max-w-lg">
          <DialogClose onClose={() => setDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת שיעור וידאו' : 'שיעור וידאו חדש'}</DialogTitle>
            <DialogDescription>{editing ? 'עדכן את פרטי השיעור' : 'הוסף שיעור וידאו חדש'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pl-1">
            <div className="space-y-1.5">
              <Label>כותרת *</Label>
              <Input value={form.title} onChange={e => field('title', e.target.value)}
                placeholder="כותרת השיעור"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>תאריך</Label>
                <Input type="date" value={form.date} onChange={e => field('date', e.target.value)}
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>משך</Label>
                <Input value={form.duration} onChange={e => field('duration', e.target.value)}
                  placeholder="45:00"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" dir="ltr" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>קטגוריה</Label>
              <Input value={form.category} onChange={e => field('category', e.target.value)}
                placeholder="למשל: הלכה, מועדים..."
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>מזהה יוטיוב</Label>
              <Input value={form.youtubeId} onChange={e => field('youtubeId', e.target.value)}
                placeholder="dQw4w9WgXcQ"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" dir="ltr" />
              <p className="text-xs text-muted-foreground">המזהה מה-URL של הסרטון (אחרי ?v=)</p>
            </div>

            <div className="space-y-1.5">
              <Label>תיאור</Label>
              <Textarea value={form.description} onChange={e => field('description', e.target.value)}
                placeholder="תיאור קצר של השיעור..." rows={3}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>צפיות</Label>
                <Input value={form.views} onChange={e => field('views', e.target.value)}
                  placeholder="0" type="number" dir="ltr"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label>סימון</Label>
                <label className="flex items-center gap-2 text-sm cursor-pointer h-10 px-3 rounded-md border border-input bg-white">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={e => field('isNew', e.target.checked)}
                    className="rounded"
                  />
                  סמן כ"שיעור חדש"
                </label>
              </div>
            </div>

            {editing && (editing.createdByName || editing.updatedByName) && (
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">מעקב שינויים</p>
                {editing.createdByName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">נוצר על ידי</span>
                    <span className="font-medium text-primary">{editing.createdByName}</span>
                  </div>
                )}
                {editing.updatedByName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">עודכן על ידי</span>
                    <span className="font-medium text-primary">{editing.updatedByName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>ביטול</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}
              className="bg-secondary text-primary hover:bg-secondary/90 gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'שמור שינויים' : 'הוסף שיעור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="relative">
          <DialogClose onClose={() => setDeleteTarget(null)} />
          <DialogHeader>
            <DialogTitle>מחיקת שיעור</DialogTitle>
            <DialogDescription>
              האם למחוק את השיעור <strong>"{deleteTarget?.title}"</strong>? פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>ביטול</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white hover:bg-red-700 gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
