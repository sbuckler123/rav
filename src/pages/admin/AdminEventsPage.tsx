import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tv2, Plus, Pencil, Trash2, Loader2, Search, MapPin, CalendarDays, Images, Check, X } from 'lucide-react';
import { airtableFetch, airtableCreate, airtableUpdate, airtableDelete } from '@/api/airtable';
import { useAuth } from '@/auth/AuthContext';
import ImageUpload from '@/components/admin/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  linkId: string;
  galleryIds: string[];
  createdByName: string;
  updatedByName: string;
}

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  order: number;
}

interface FormState {
  title: string;
  eventType: string;
  dateHebrew: string;
  dateLocale: string;
  location: string;
  excerpt: string;
}

const EMPTY_FORM: FormState = {
  title: '', eventType: '', dateHebrew: '', dateLocale: '',
  location: '', excerpt: '',
};

const EMPTY_GALLERY_FORM = { url: '', caption: '', order: '' };

function extractField(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value != null) return String(val.value).trim();
  return '';
}

async function fetchEvents(userRecords: any[] = []): Promise<AdminEvent[]> {
  const data = await airtableFetch('אירועים', {}, [{ field: 'תאריך לועזי', direction: 'desc' }]);
  const getUserName = (ids: any) => {
    if (!Array.isArray(ids) || !ids.length) return '';
    return userRecords.find((r: any) => r.id === ids[0])?.fields['שם'] ?? '';
  };
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
      linkId: extractField(f['מזהה קישור']) || extractField(f['מזהה URL']),
      galleryIds: Array.isArray(f['גלריה']) ? f['גלריה'] : [],
      createdByName: getUserName(f['נוצר על ידי']),
      updatedByName: getUserName(f['עודכן על ידי']),
    };
  });
}

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Gallery state
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [newGallery, setNewGallery] = useState(EMPTY_GALLERY_FORM);
  const [savingGallery, setSavingGallery] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galleryEditForm, setGalleryEditForm] = useState(EMPTY_GALLERY_FORM);

  function load() {
    setLoading(true);
    airtableFetch('משתמשים')
      .then(usersData => fetchEvents(usersData.records ?? []))
      .then(setEvents)
      .catch(() => toast.error('שגיאה בטעינת אירועים'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function loadGallery(ids: string[]) {
    if (!ids.length) { setGallery([]); return; }
    setGalleryLoading(true);
    try {
      const formula = ids.length === 1
        ? `RECORD_ID()='${ids[0]}'`
        : `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`;
      const data = await airtableFetch('גלריה', { filterByFormula: formula });
      setGallery(
        data.records
          .map((r: any) => ({
            id: r.id,
            url: r.fields['URL תמונה'] ?? '',
            caption: r.fields['כיתוב'] ?? '',
            order: r.fields['סדר'] ?? 0,
          }))
          .sort((a: GalleryItem, b: GalleryItem) => a.order - b.order)
      );
    } catch {
      toast.error('שגיאה בטעינת גלריה');
    } finally {
      setGalleryLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setGallery([]);
    setNewGallery(EMPTY_GALLERY_FORM);
    setEditingGalleryId(null);
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
    });
    setNewGallery(EMPTY_GALLERY_FORM);
    setEditingGalleryId(null);
    setDialogOpen(true);
    loadGallery(e.galleryIds);
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
      };
      if (form.eventType.trim())   fields['סוג אירוע']    = form.eventType.trim();
      if (form.dateHebrew.trim())  fields['תאריך עברי']   = form.dateHebrew.trim();
      if (form.dateLocale.trim())  fields['תאריך לועזי']  = form.dateLocale.trim();
      if (form.location.trim())    fields['מיקום']         = form.location.trim();
      if (form.excerpt.trim())     fields['תקציר קצר']    = form.excerpt.trim();

      if (user?.id) fields['עודכן על ידי'] = [user.id];

      if (editing) {
        await airtableUpdate('אירועים', editing.id, fields);
        toast.success('האירוע עודכן');
      } else {
        if (user?.id) fields['נוצר על ידי'] = [user.id];
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

  async function handleAddGalleryItem() {
    if (!newGallery.url.trim() || !editing) return;
    setSavingGallery(true);
    try {
      const fields: Record<string, unknown> = { 'URL תמונה': newGallery.url.trim() };
      if (newGallery.caption.trim()) fields['כיתוב'] = newGallery.caption.trim();
      const orderNum = parseInt(newGallery.order);
      if (!isNaN(orderNum)) fields['סדר'] = orderNum;

      const record = await airtableCreate('גלריה', fields);
      const newIds = [...editing.galleryIds, record.id];
      await airtableUpdate('אירועים', editing.id, { 'גלריה': newIds });

      const updated = { ...editing, galleryIds: newIds };
      setEditing(updated);
      setEvents(evs => evs.map(e => e.id === editing.id ? updated : e));
      setNewGallery(EMPTY_GALLERY_FORM);
      loadGallery(newIds);
      toast.success('התמונה נוספה');
    } catch {
      toast.error('שגיאה בהוספת תמונה');
    } finally {
      setSavingGallery(false);
    }
  }

  async function handleSaveGalleryEdit(itemId: string) {
    if (!galleryEditForm.url.trim()) return;
    setSavingGallery(true);
    try {
      const fields: Record<string, unknown> = { 'URL תמונה': galleryEditForm.url.trim() };
      if (galleryEditForm.caption.trim()) fields['כיתוב'] = galleryEditForm.caption.trim();
      const orderNum = parseInt(galleryEditForm.order);
      if (!isNaN(orderNum)) fields['סדר'] = orderNum;

      await airtableUpdate('גלריה', itemId, fields);
      setEditingGalleryId(null);
      loadGallery(editing?.galleryIds ?? []);
      toast.success('התמונה עודכנה');
    } catch {
      toast.error('שגיאה בעדכון תמונה');
    } finally {
      setSavingGallery(false);
    }
  }

  async function handleDeleteGalleryItem(itemId: string) {
    if (!editing) return;
    setSavingGallery(true);
    try {
      await airtableDelete('גלריה', itemId);
      const newIds = editing.galleryIds.filter(id => id !== itemId);
      await airtableUpdate('אירועים', editing.id, { 'גלריה': newIds });

      const updated = { ...editing, galleryIds: newIds };
      setEditing(updated);
      setEvents(evs => evs.map(e => e.id === editing.id ? updated : e));
      loadGallery(newIds);
      toast.success('התמונה נמחקה');
    } catch {
      toast.error('שגיאה במחיקת תמונה');
    } finally {
      setSavingGallery(false);
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
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Tv2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-primary">אירועים</h1>
          <p className="text-sm text-muted-foreground">{events.length} אירועים</p>
        </div>
        <Button
          onClick={openAdd}
          className="inline-flex items-center gap-2 h-11 bg-secondary text-primary hover:bg-secondary/90 flex-shrink-0"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">אירוע חדש</span>
          <span className="sm:hidden">חדש</span>
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
                <div key={e.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-primary truncate text-sm">{e.title}</p>
                      {e.galleryIds.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                          <Images className="h-3 w-3" />{e.galleryIds.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                      {e.dateLocale && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />{e.dateLocale}
                        </span>
                      )}
                      {e.location && (
                        <span className="flex items-center gap-1 hidden sm:flex">
                          <MapPin className="h-3 w-3" />{e.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {e.eventType && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 hidden sm:block"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {e.eventType}
                    </span>
                  )}

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(e)}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(e)}
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
            <DialogTitle>{editing ? 'עריכת אירוע' : 'אירוע חדש'}</DialogTitle>
            <DialogDescription>{editing ? 'עדכן את פרטי האירוע' : 'הוסף אירוע חדש'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pl-1">

            {/* ── Event fields ── */}
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


            {editing && editing.linkId && (
              <div className="space-y-1.5">
                <Label>מזהה קישור</Label>
                <div className="px-3 py-2 rounded-md border border-border bg-muted text-sm text-muted-foreground font-mono" dir="ltr">
                  {editing.linkId}
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

            {/* ── Gallery section (edit only) ── */}
            {editing && (
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Images className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">גלריה</p>
                  {galleryLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>

                {/* Existing images */}
                {gallery.length > 0 && (
                  <div className="space-y-2">
                    {gallery.map(item => (
                      <div key={item.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                        {editingGalleryId === item.id ? (
                          /* Edit row */
                          <div className="p-3 space-y-2">
                            <ImageUpload
                              value={galleryEditForm.url}
                              onUpload={url => setGalleryEditForm(f => ({ ...f, url }))}
                              onClear={() => setGalleryEditForm(f => ({ ...f, url: '' }))}
                              disabled={savingGallery}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={galleryEditForm.caption}
                                onChange={e => setGalleryEditForm(f => ({ ...f, caption: e.target.value }))}
                                placeholder="כיתוב"
                                className="border border-input bg-white text-sm focus-visible:ring-1 focus-visible:border-secondary"
                              />
                              <Input
                                value={galleryEditForm.order}
                                onChange={e => setGalleryEditForm(f => ({ ...f, order: e.target.value }))}
                                placeholder="סדר"
                                type="number"
                                dir="ltr"
                                className="border border-input bg-white text-sm focus-visible:ring-1 focus-visible:border-secondary"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveGalleryEdit(item.id)}
                                disabled={savingGallery || !galleryEditForm.url.trim()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-primary text-xs font-medium hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                              >
                                {savingGallery ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                שמור
                              </button>
                              <button
                                onClick={() => setEditingGalleryId(null)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors"
                              >
                                <X className="h-3 w-3" />
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display row */
                          <div className="flex items-center gap-3 p-2">
                            {/* Thumbnail */}
                            <div className="w-14 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                              {item.url
                                ? <img src={item.url} alt={item.caption} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                : <div className="w-full h-full flex items-center justify-center"><Images className="h-4 w-4 text-muted-foreground" /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              {item.caption && <p className="text-sm font-medium text-primary truncate">{item.caption}</p>}
                              <p className="text-xs text-muted-foreground truncate" dir="ltr">{item.url}</p>
                              {item.order > 0 && <p className="text-xs text-muted-foreground">סדר: {item.order}</p>}
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => { setEditingGalleryId(item.id); setGalleryEditForm({ url: item.url, caption: item.caption, order: item.order > 0 ? String(item.order) : '' }); }}
                                className="inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGalleryItem(item.id)}
                                disabled={savingGallery}
                                className="inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!galleryLoading && gallery.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">אין תמונות בגלריה</p>
                )}

                {/* Add new image */}
                <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">הוסף תמונה</p>
                  <ImageUpload
                    value={newGallery.url}
                    onUpload={url => setNewGallery(f => ({ ...f, url }))}
                    onClear={() => setNewGallery(f => ({ ...f, url: '' }))}
                    disabled={savingGallery}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newGallery.caption}
                      onChange={e => setNewGallery(f => ({ ...f, caption: e.target.value }))}
                      placeholder="כיתוב"
                      className="border border-input bg-white text-sm focus-visible:ring-1 focus-visible:border-secondary"
                    />
                    <Input
                      value={newGallery.order}
                      onChange={e => setNewGallery(f => ({ ...f, order: e.target.value }))}
                      placeholder="סדר"
                      type="number"
                      dir="ltr"
                      className="border border-input bg-white text-sm focus-visible:ring-1 focus-visible:border-secondary"
                    />
                  </div>
                  <button
                    onClick={handleAddGalleryItem}
                    disabled={savingGallery || !newGallery.url.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {savingGallery ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    הוסף תמונה
                  </button>
                </div>
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
