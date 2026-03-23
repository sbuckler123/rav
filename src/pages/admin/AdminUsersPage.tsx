import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Plus, Pencil, Trash2, Loader2, Search, ShieldAlert } from 'lucide-react';
import { airtableFetch, airtableCreate, airtableUpdate, airtableDelete } from '@/api/airtable';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  name: '', email: '', password: '', role: 'צוות', status: 'פעיל',
};

const ROLES = ['מנהל', 'רב', 'צוות'];
const STATUSES = ['פעיל', 'לא פעיל'];

function roleBadge(role: string) {
  const map: Record<string, string> = {
    'מנהל': 'bg-primary/10 text-primary border-primary/20',
    'רב':   'bg-secondary/20 text-secondary border-secondary/30',
    'צוות': 'bg-muted text-muted-foreground border-border',
  };
  return <Badge className={cn('text-xs', map[role] ?? map['צוות'])}>{role}</Badge>;
}

function statusBadge(status: string) {
  return status === 'פעיל'
    ? <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">פעיל</Badge>
    : <Badge className="bg-muted text-muted-foreground border-border text-xs">לא פעיל</Badge>;
}

async function fetchUsers(): Promise<AdminUser[]> {
  const data = await airtableFetch('משתמשים', {}, [{ field: 'שם', direction: 'asc' }]);
  return data.records.map((r: any) => ({
    id: r.id,
    name: r.fields['שם'] ?? '',
    email: r.fields['אימייל'] ?? '',
    role: r.fields['תפקיד'] ?? 'צוות',
    status: r.fields['סטטוס'] ?? 'פעיל',
  }));
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Guard — only מנהל can access
  if (currentUser?.role !== 'מנהל') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-primary">גישה מוגבלת</h2>
        <p className="text-sm text-muted-foreground">רק מנהלים יכולים לצפות בדף זה</p>
      </div>
    );
  }

  function load() {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(() => toast.error('שגיאה בטעינת משתמשים'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(u: AdminUser) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, status: u.status });
    setDialogOpen(true);
  }

  function field(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    if (!editing && !form.password.trim()) {
      toast.error('סיסמה היא שדה חובה למשתמש חדש');
      return;
    }
    setSaving(true);
    try {
      const fields: Record<string, unknown> = {
        'שם': form.name.trim(),
        'אימייל': form.email.trim(),
        'תפקיד': form.role,
        'סטטוס': form.status,
      };
      // Only update password if a new one was entered
      if (form.password.trim()) fields['סיסמא'] = form.password.trim();

      if (editing) {
        await airtableUpdate('משתמשים', editing.id, fields);
        toast.success('המשתמש עודכן');
      } else {
        await airtableCreate('משתמשים', fields);
        toast.success('המשתמש נוסף');
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
    if (deleteTarget.id === currentUser?.id) {
      toast.error('לא ניתן למחוק את המשתמש הנוכחי');
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await airtableDelete('משתמשים', deleteTarget.id);
      toast.success('המשתמש נמחק');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = users.filter(u =>
    !search || u.name.includes(search) || u.email.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">משתמשים</h1>
            <p className="text-sm text-muted-foreground">{users.length} משתמשים</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]">
          <Plus className="h-4 w-4" />
          משתמש חדש
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או אימייל..."
          className="pr-9 border border-input bg-white"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 px-5 flex items-center gap-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="h-4 bg-muted animate-pulse rounded w-32" />
                <div className="h-5 bg-muted animate-pulse rounded w-16 mr-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">לא נמצאו משתמשים</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{u.name.charAt(0)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-primary">{u.name}</p>
                    {u.id === currentUser?.id && (
                      <span className="text-xs text-muted-foreground">(אתה)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground" dir="ltr">{u.email}</p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {roleBadge(u.role)}
                  {statusBadge(u.status)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary" onClick={() => openEdit(u)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-red-600"
                    disabled={u.id === currentUser?.id}
                    onClick={() => setDeleteTarget(u)}
                  >
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
            <DialogTitle>{editing ? 'עריכת משתמש' : 'משתמש חדש'}</DialogTitle>
            <DialogDescription>{editing ? 'עדכן את פרטי המשתמש' : 'הוסף משתמש חדש למערכת'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>שם מלא *</Label>
              <Input value={form.name} onChange={e => field('name', e.target.value)}
                placeholder="ישראל ישראלי"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>אימייל *</Label>
              <Input value={form.email} onChange={e => field('email', e.target.value)}
                placeholder="user@example.com" type="email" dir="ltr"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>{editing ? 'סיסמה חדשה (השאר ריק לאי שינוי)' : 'סיסמה *'}</Label>
              <Input value={form.password} onChange={e => field('password', e.target.value)}
                placeholder={editing ? '••••••••' : 'בחר סיסמה'} type="password" dir="ltr"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>תפקיד</Label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} onClick={() => field('role', r)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                      form.role === r
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-muted-foreground border-border hover:border-primary'
                    )}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>סטטוס</Label>
              <div className="flex gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => field('status', s)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                      form.status === s
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-muted-foreground border-border hover:border-primary'
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>ביטול</Button>
            <Button onClick={handleSave}
              disabled={!form.name.trim() || !form.email.trim() || saving}
              className="bg-secondary text-primary hover:bg-secondary/90 gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'שמור שינויים' : 'הוסף משתמש'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="relative">
          <DialogClose onClose={() => setDeleteTarget(null)} />
          <DialogHeader>
            <DialogTitle>מחיקת משתמש</DialogTitle>
            <DialogDescription>
              האם למחוק את המשתמש <strong>"{deleteTarget?.name}"</strong>? פעולה זו אינה ניתנת לביטול.
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
