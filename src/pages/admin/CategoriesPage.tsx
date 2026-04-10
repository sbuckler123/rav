import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tag, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  status: string;
  tables: string[];
}

const STATUS_OPTIONS = ['פעיל', 'לא פעיל'];
const TABLE_OPTIONS  = ['מאמרים', 'שיעורים', 'שיעורי וידאו', 'אירועים', 'שאלות'];

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Error ${res.status}`);
  return data as T;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('פעיל');
  const [formTables, setFormTables] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<Category[]>('/api/categories?admin=true')
      .then(setCategories)
      .catch(() => toast.error('שגיאה בטעינת קטגוריות'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setFormName('');
    setFormStatus('פעיל');
    setFormTables([]);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setFormName(cat.name);
    setFormStatus(cat.status);
    setFormTables(cat.tables);
    setDialogOpen(true);
  }

  function toggleTable(t: string) {
    setFormTables(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/categories?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName.trim(), status: formStatus, tables: formTables }),
        });
        toast.success('הקטגוריה עודכנה');
      } else {
        await apiFetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName.trim(), tables: formTables, status: formStatus }),
        });
        toast.success('הקטגוריה נוספה');
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
      await apiFetch(`/api/categories?id=${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('הקטגוריה נמחקה');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = categories.filter(c =>
    !search || c.name.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">קטגוריות</h1>
            <p className="text-sm text-muted-foreground">{categories.length} קטגוריות</p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          קטגוריה חדשה
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש קטגוריה..."
          className="pr-9 border border-input bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 px-5 flex items-center gap-3">
                <div className="h-4 bg-muted animate-pulse rounded w-40" />
                <div className="h-5 bg-muted animate-pulse rounded w-16 mr-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">לא נמצאו קטגוריות</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary">{cat.name}</p>
                  {cat.tables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.tables.map(t => (
                        <span key={t} className="text-xs bg-primary/8 text-primary/70 rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <Badge className={cn(
                  'text-xs flex-shrink-0',
                  cat.status === 'פעיל'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-muted text-muted-foreground border-border'
                )}>
                  {cat.status}
                </Badge>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary" onClick={() => openEdit(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(cat)}>
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
            <DialogTitle>{editing ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</DialogTitle>
            <DialogDescription>
              {editing ? 'עדכן את פרטי הקטגוריה' : 'הוסף קטגוריה חדשה למערכת'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">שם הקטגוריה</Label>
              <Input
                id="cat-name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="למשל: הלכה, מועדים, תפילה..."
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>שייך לטבלאות</Label>
              <div className="flex flex-wrap gap-2">
                {TABLE_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTable(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                      formTables.includes(t)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-muted-foreground border-border hover:border-primary'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>סטטוס</Label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormStatus(s)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                      formStatus === s
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-muted-foreground border-border hover:border-primary'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || saving}
              className="bg-secondary text-primary hover:bg-secondary/90 gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'שמור שינויים' : 'הוסף קטגוריה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="relative">
          <DialogClose onClose={() => setDeleteTarget(null)} />
          <DialogHeader>
            <DialogTitle>מחיקת קטגוריה</DialogTitle>
            <DialogDescription>
              האם למחוק את הקטגוריה <strong>"{deleteTarget?.name}"</strong>? פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              ביטול
            </Button>
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
