import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tv2, Plus, Pencil, Trash2, Loader2, Search, MapPin, CalendarDays } from 'lucide-react';
import { airtableFetch, airtableCreate, airtableUpdate, airtableDelete } from '@/api/airtable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { getEventTypeStyle } from '@/lib/yoman';

interface AdminEvent {
  id: string;
  title: string;
  eventType: string;
  dateHebrew: string;
  dateLocale: string;
  location: string;
  excerpt: string;
  participants: string;
  linkId: string;
}

interface FormState {
  title: string;
  eventType: string;
  dateHebrew: string;
  dateLocale: string;
  location: string;
  excerpt: string;
  participants: string;
}

const EMPTY_FORM: FormState = {
  title: '', eventType: '', dateHebrew: '', dateLocale: '',
  location: '', excerpt: '', participants: '',
};

function extractField(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value != null) return String(val.value).trim();
  return '';
}

async function fetchEvents(): Promise<AdminEvent[]> {
  const data = await airtableFetch('אירועים', {}, [{ field: 'תאריך לועזי', direction: 'desc' }]);
  return data.records.map((r: any) => {
    const f = r.fields;
    return {
      id: r.id,
      title: extractField(f['כותרת']),
      eventType: extractField(f['סוג אירוע']),
      dateHebrew: extractField(f['תאריך עברי']),
      dateLocale: extractField(f['תאריך לועזי']),
      location: extractField(f['מיקום']),
      excerpt: extractField(f['תקציר קצר']),
      participants: extractField(f['משתתפים']),
      linkId: extractField(f['מזהה קישור']) || extractField(f['מזהה URL']),
    };
  });
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    fetchEvents()
      .then(setEvents)
      .catch(() => toast.error('שגיאה בטעינת אירועים'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(e: AdminEvent) {
    setEditing(e);
    setForm({
      title: e.title,
      eventType: e.eventType,
      dateHebrew: e.dateHebrew,
      dateLocale: e.dateLocale,
      location: e.location,
      excerpt: e.excerpt,
      participants: e.participants,
    });
    setDialogOpen(true);
  }

  function field(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        'כותרת': form.title.trim(),
        'סוג אירוע': form.eventType.trim(),
        'תאריך עברי': form.dateHebrew.trim(),
        'תאריך לועזי': form.dateLocale.trim(),
        'מיקום': form.location.trim(),
        'תקציר קצר': form.excerpt.trim(),
        'משתתפים': form.participants.trim(),
      };

      if (editing) {
        await airtableUpdate('אירועים', editing.id, fields);
        toast.success('האירוע עודכן');
      } else {
        await airtableCreate('אירועים', fields);
        toast.success('האירוע נוסף');
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
      await airtableDelete('אירועים', deleteTarget.id);
      toast.success('האירוע נמחק');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = events.filter(e =>
    !search || e.title.includes(search) || e.location.includes(search) || e.eventType.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <Tv2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">אירועים</h1>
            <p className="text-sm text-muted-foreground">{events.length} אירועים</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]">
          <Plus className="h-4 w-4" />
          אירוע חדש
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי כותרת, סוג או מיקום..."
          className="pr-9 border border-input bg-white"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 px-5 flex items-center gap-3">
                <div className="h-4 bg-muted animate-pulse rounded w-48" />
                <div className="h-5 bg-muted animate-pulse rounded w-20 mr-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">לא נמצאו אירועים</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(e => {
              const style = getEventTypeStyle(e.eventType);
              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary truncate">{e.title}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                      {e.dateLocale && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />{e.dateLocale}
                        </span>
                      )}
                      {e.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{e.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event type badge */}
                  {e.eventType && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 hidden sm:block"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {e.eventType}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary" onClick={() => openEdit(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <DialogTitle>{editing ? 'עריכת אירוע' : 'אירוע חדש'}</DialogTitle>
            <DialogDescription>{editing ? 'עדכן את פרטי האירוע' : 'הוסף אירוע חדש'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pl-1">
            <div className="space-y-1.5">
              <Label>כותרת *</Label>
              <Input value={form.title} onChange={e => field('title', e.target.value)}
                placeholder="כותרת האירוע"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>סוג אירוע</Label>
              <Input value={form.eventType} onChange={e => field('eventType', e.target.value)}
                placeholder="למשל: הרצאה, טקס, כנס..."
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>תאריך לועזי</Label>
                <Input value={form.dateLocale} onChange={e => field('dateLocale', e.target.value)}
                  placeholder="למשל: 15.03.2025"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label>תאריך עברי</Label>
                <Input value={form.dateHebrew} onChange={e => field('dateHebrew', e.target.value)}
                  placeholder="למשל: י״ד אדר תשפ״ה"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>מיקום</Label>
              <Input value={form.location} onChange={e => field('location', e.target.value)}
                placeholder="שם המקום"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>תקציר קצר</Label>
              <Textarea value={form.excerpt} onChange={e => field('excerpt', e.target.value)}
                placeholder="תיאור קצר של האירוע..." rows={3}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none" />
            </div>

            <div className="space-y-1.5">
              <Label>משתתפים</Label>
              <Textarea value={form.participants} onChange={e => field('participants', e.target.value)}
                placeholder="שם משתתף אחד בכל שורה..." rows={3}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none" />
              <p className="text-xs text-muted-foreground">שם אחד בכל שורה</p>
            </div>

            {editing && editing.linkId && (
              <div className="space-y-1.5">
                <Label>מזהה קישור</Label>
                <div className="px-3 py-2 rounded-md border border-border bg-muted text-sm text-muted-foreground font-mono" dir="ltr">
                  {editing.linkId}
                </div>
                <p className="text-xs text-muted-foreground">שדה זה נוצר אוטומטית ואינו ניתן לעריכה</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>ביטול</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}
              className="bg-secondary text-primary hover:bg-secondary/90 gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'שמור שינויים' : 'הוסף אירוע'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="relative">
          <DialogClose onClose={() => setDeleteTarget(null)} />
          <DialogHeader>
            <DialogTitle>מחיקת אירוע</DialogTitle>
            <DialogDescription>
              האם למחוק את האירוע <strong>"{deleteTarget?.title}"</strong>? פעולה זו אינה ניתנת לביטול.
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
