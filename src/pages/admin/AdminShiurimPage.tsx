import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Plus, Pencil, Trash2, Loader2, Search, Clock, MapPin } from 'lucide-react';
import { fetchCategories, createCategory, type Category } from '@/api/categoriesApi';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

interface Shiur {
  id: string;
  title: string;
  dateRaw: string;
  dateDisplay: string;
  time: string;
  location: string;
  description: string;
  categoryId: string;
  category: string;
  linkId: string;
  createdByName: string;
  updatedByName: string;
}

interface FormState {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  categoryId: string;
  linkId: string;
}

const EMPTY_FORM: FormState = {
  title: '', date: '', time: '', location: '', description: '', categoryId: '', linkId: '',
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Error ${res.status}`);
  return data as T;
}

export default function AdminShiurimPage() {
  const { user } = useAuth();
  const [shiurim, setShiurim] = useState<Shiur[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shiur | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Shiur | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<Shiur[]>('/api/admin-shiurim'),
      fetchCategories('שיעורים'),
    ])
      .then(([data, cats]) => { setShiurim(data); setCategories(cats); })
      .catch(() => toast.error('שגיאה בטעינת שיעורים'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function field(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setAddingCategory(false);
    setNewCategoryName('');
    setDialogOpen(true);
  }

  function openEdit(s: Shiur) {
    setEditing(s);
    setForm({
      title: s.title,
      date: s.dateRaw,
      time: s.time,
      location: s.location,
      description: s.description,
      categoryId: s.categoryId,
      linkId: s.linkId,
    });
    setAddingCategory(false);
    setNewCategoryName('');
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      let categoryId = form.categoryId;

      if (addingCategory && newCategoryName.trim()) {
        const created = await createCategory(['שיעורים'], newCategoryName.trim());
        setCategories(prev => [...prev, created]);
        categoryId = created.id;
      }

      const body = {
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        location: form.location,
        description: form.description,
        categoryId,
        userId: user?.id,
      };

      if (editing) {
        await apiFetch(`/api/admin-shiurim?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        toast.success('השיעור עודכן');
      } else {
        await apiFetch('/api/admin-shiurim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
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
      await apiFetch(`/api/admin-shiurim?id=${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('השיעור נמחק');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = shiurim.filter(s =>
    !search || s.title.includes(search) || s.location.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">שיעורים</h1>
            <p className="text-sm text-muted-foreground">{shiurim.length} שיעורים</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]">
          <Plus className="h-4 w-4" />
          שיעור חדש
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי כותרת או מיקום..."
          className="pr-9 border border-input bg-white" />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 px-5 flex items-center gap-3">
                <div className="h-4 bg-muted animate-pulse rounded w-48" />
                <div className="h-4 bg-muted animate-pulse rounded w-24 mr-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">לא נמצאו שיעורים</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="w-16 flex-shrink-0 text-center bg-primary/5 rounded-lg py-1.5">
                  <p className="text-xs font-bold text-primary leading-none">{s.dateDisplay.split('.')[0]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.dateDisplay.split('.').slice(1).join('.')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary truncate">{s.title}</p>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                    {s.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.time}</span>}
                    {s.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>}
                  </div>
                </div>
                {s.category && <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">{s.category}</span>}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="relative">
          <DialogClose onClose={() => setDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת שיעור' : 'שיעור חדש'}</DialogTitle>
            <DialogDescription>{editing ? 'עדכן את פרטי השיעור' : 'הוסף שיעור חדש'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto ps-1">
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
                <Label>שעה</Label>
                <Input value={form.time} onChange={e => field('time', e.target.value)}
                  placeholder="19:00"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" dir="ltr" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>מיקום</Label>
              <Input value={form.location} onChange={e => field('location', e.target.value)}
                placeholder="שם המקום"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>קטגוריה</Label>
              {!addingCategory ? (
                <div className="flex gap-2">
                  <select value={form.categoryId} onChange={e => field('categoryId', e.target.value)}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-secondary">
                    <option value="">ללא קטגוריה</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => { setAddingCategory(true); setNewCategoryName(''); }}
                    className="inline-flex items-center gap-1 px-3 h-10 rounded-md border border-input bg-white text-sm text-muted-foreground hover:text-primary hover:border-secondary transition-colors whitespace-nowrap">
                    <Plus className="h-3.5 w-3.5" />חדשה
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="שם הקטגוריה החדשה..."
                    className="flex-1 border border-secondary bg-white focus-visible:ring-1 focus-visible:border-secondary"
                    onKeyDown={e => { if (e.key === 'Escape') setAddingCategory(false); }} />
                  <button type="button" onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}
                    className="inline-flex items-center px-3 h-10 rounded-md border border-input bg-white text-sm text-muted-foreground hover:text-primary transition-colors">
                    ביטול
                  </button>
                </div>
              )}
              {addingCategory && <p className="text-xs text-muted-foreground">הקטגוריה תיווסף לרשימה בעת השמירה</p>}
            </div>

            <div className="space-y-1.5">
              <Label>תיאור</Label>
              <Textarea value={form.description} onChange={e => field('description', e.target.value)}
                placeholder="תיאור קצר של השיעור..." rows={3}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none" />
            </div>

            {editing && form.linkId && (
              <div className="space-y-1.5">
                <Label>מזהה קישור</Label>
                <div className="px-3 py-2 rounded-md border border-border bg-muted text-sm text-muted-foreground font-mono" dir="ltr">
                  {form.linkId}
                </div>
                <p className="text-xs text-muted-foreground">שדה זה נוצר אוטומטית ואינו ניתן לעריכה</p>
              </div>
            )}

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
