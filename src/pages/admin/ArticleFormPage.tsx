import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Loader2, Save, Eye, EyeOff, Plus, Check, Pencil, X } from 'lucide-react';
import { fetchCategories, createCategory, renameCategory, deleteCategory, type Category } from '@/api/categoriesApi';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FormState {
  title: string;
  yearNum: string;
  categoryId: string;
  tags: string[];
  status: string;
  readTime: string;
  abstract: string;
  fullContent: string;
  pdfUrl: string;
  keyPoints: string;
  sources: string;
}

const EMPTY_FORM: FormState = {
  title: '', yearNum: '',
  categoryId: '', tags: [], status: 'לא פעיל', readTime: '', abstract: '',
  fullContent: '', pdfUrl: '', keyPoints: '', sources: '',
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Error ${res.status}`);
  return data as T;
}

export default function ArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkId, setLinkId] = useState('');
  const [createdByName, setCreatedByName] = useState('');
  const [updatedByName, setUpdatedByName] = useState('');
  const [gregYearOptions, setGregYearOptions] = useState<string[]>([]);

  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    const tasks: Promise<unknown>[] = [
      apiFetch<string[]>('/api/admin-articles?type=fieldChoices&field=%D7%A9%D7%A0%D7%94%20%D7%9C%D7%95%D7%A2%D7%96%D7%99%D7%AA'),
      fetchCategories('מאמרים'),
      apiFetch<string[]>('/api/admin-articles?type=fieldChoices&field=%D7%AA%D7%92%D7%99%D7%95%D7%AA'),
    ];
    if (isEdit) {
      tasks.push(apiFetch(`/api/admin-articles?id=${id}`));
    }

    Promise.all(tasks)
      .then(([gregChoices, cats, tagChoices, articleData]) => {
        setGregYearOptions(gregChoices as string[]);
        setCategoryOptions(cats as Category[]);
        setTagOptions(tagChoices as string[]);
        if (!isEdit || !articleData) return;

        const a = articleData as {
          title: string; status: string; yearNum: string; categoryId: string;
          tags: string[]; abstract: string; fullContent: string; pdfUrl: string;
          keyPoints: string; sources: string; readTime: string; linkId: string;
          createdByName: string; updatedByName: string;
        };
        setCreatedByName(a.createdByName);
        setUpdatedByName(a.updatedByName);
        setLinkId(a.linkId);
        setForm({
          title:       a.title,
          yearNum:     a.yearNum,
          categoryId:  a.categoryId,
          tags:        a.tags,
          status:      a.status,
          readTime:    a.readTime,
          abstract:    a.abstract,
          fullContent: a.fullContent,
          pdfUrl:      a.pdfUrl,
          keyPoints:   a.keyPoints,
          sources:     a.sources,
        });
      })
      .catch(() => toast.error('שגיאה בטעינת נתונים'))
      .finally(() => setLoading(false));
  }, [id]);

  function field(key: keyof FormState, val: string | string[]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleAddCategory() {
    const name = newCategoryInput.trim();
    if (!name) return;
    setSavingCategory(true);
    try {
      const created = await createCategory(['מאמרים'], name);
      setCategoryOptions(prev => [...prev, created]);
      field('categoryId', created.id);
      setNewCategoryInput('');
      setAddingCategory(false);
      toast.success('הקטגוריה נוספה');
    } catch {
      toast.error('שגיאה בהוספת קטגוריה');
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleRenameCategory(cat: Category) {
    const newName = editCategoryInput.trim();
    if (!newName || newName === cat.name) { setEditingCategoryId(null); return; }
    setSavingCategory(true);
    try {
      await renameCategory(cat.id, newName);
      setCategoryOptions(prev => prev.map(c => c.id === cat.id ? { ...c, name: newName } : c));
      setEditingCategoryId(null);
      toast.success('הקטגוריה עודכנה');
    } catch {
      toast.error('שגיאה בעדכון הקטגוריה');
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(cat: Category) {
    setSavingCategory(true);
    try {
      await deleteCategory(cat.id);
      setCategoryOptions(prev => prev.filter(c => c.id !== cat.id));
      if (form.categoryId === cat.id) field('categoryId', '');
      toast.success('הקטגוריה נמחקה');
    } catch {
      toast.error('שגיאה במחיקת הקטגוריה');
    } finally {
      setSavingCategory(false);
    }
  }

  function handleAddTag() {
    const t = newTagInput.trim();
    if (t && !form.tags.includes(t)) {
      if (!tagOptions.includes(t)) setTagOptions(prev => [...prev, t]);
      field('tags', [...form.tags, t]);
    }
    setNewTagInput('');
    setAddingTag(false);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('כותרת היא שדה חובה'); return; }
    setSaving(true);
    try {
      const body = {
        title:           form.title.trim(),
        status:          form.status,
        categoryId:      form.categoryId || undefined,
        tags:            form.tags.length ? form.tags : undefined,
        fullContent:     form.fullContent.trim() || undefined,
        pdfUrl:          form.pdfUrl.trim() || undefined,
        keyPoints:       form.keyPoints.trim() || undefined,
        sources:         form.sources.trim() || undefined,
        yearNum:         form.yearNum.trim() || undefined,
        gregYearOptions: gregYearOptions.length ? gregYearOptions : undefined,
        userId:          user?.id,
      };

      if (isEdit) {
        await apiFetch(`/api/admin-articles?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        toast.success('המאמר עודכן');
      } else {
        await apiFetch('/api/admin-articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        toast.success('המאמר נוסף');
      }
      navigate('/admin/articles');
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
          <Link to="/admin/articles">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Link>
        </Button>
        <div className="w-px h-5 bg-border" />
        <h1 className="text-xl font-bold text-primary flex-1">
          {isEdit ? 'עריכת מאמר' : 'מאמר חדש'}
        </h1>
        <Button onClick={handleSave} disabled={saving} className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'שומר...' : 'שמור'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">

        {/* Metadata sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">פרטי מאמר</p>

            <div className="space-y-1.5">
              <Label>כותרת *</Label>
              <Input value={form.title} onChange={e => field('title', e.target.value)}
                placeholder="כותרת המאמר"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>סטטוס</Label>
              <div className="flex gap-2">
                {['פעיל', 'לא פעיל'].map(s => (
                  <button key={s} type="button" onClick={() => field('status', s)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                      form.status === s
                        ? s === 'פעיל' ? 'bg-green-600 text-white border-green-600' : 'bg-primary text-white border-primary'
                        : 'bg-white text-muted-foreground border-border hover:border-primary'
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {isEdit && form.abstract && (
              <div className="space-y-1.5">
                <Label>תקציר</Label>
                <div className="px-3 py-2 rounded-md border border-border bg-muted text-sm text-muted-foreground leading-relaxed">
                  {form.abstract}
                </div>
                <p className="text-xs text-muted-foreground">נוצר אוטומטית על ידי AI</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>שנה לועזית</Label>
              {gregYearOptions.length > 0 ? (
                <select value={form.yearNum} onChange={e => field('yearNum', e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-secondary"
                  dir="ltr">
                  <option value="">בחר שנה</option>
                  {gregYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              ) : (
                <Input value={form.yearNum} onChange={e => field('yearNum', e.target.value)}
                  placeholder="2024" type="number" dir="ltr"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
              )}
            </div>

            {/* Categories */}
            <div className="space-y-1.5">
              <Label>קטגוריה</Label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(cat => (
                  editingCategoryId === cat.id ? (
                    <div key={cat.id} className="flex items-center gap-1">
                      <Input autoFocus value={editCategoryInput} onChange={e => setEditCategoryInput(e.target.value)}
                        disabled={savingCategory}
                        className="h-8 w-32 text-sm border border-secondary bg-white focus-visible:ring-1"
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); handleRenameCategory(cat); }
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }} />
                      <button type="button" disabled={savingCategory} onClick={() => handleRenameCategory(cat)}
                        className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50">
                        {savingCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                      <button type="button" disabled={savingCategory} onClick={() => setEditingCategoryId(null)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div key={cat.id}
                      className={cn(
                        'group inline-flex items-center rounded-full border text-sm font-medium transition-all overflow-hidden',
                        form.categoryId === cat.id ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border'
                      )}>
                      <button type="button" disabled={savingCategory}
                        onClick={() => field('categoryId', form.categoryId === cat.id ? '' : cat.id)}
                        className="px-3 py-1.5 hover:opacity-80 transition-opacity disabled:opacity-50">
                        {cat.name}
                      </button>
                      <div className={cn(
                        'flex items-center gap-0.5 pr-1.5 transition-all',
                        'opacity-100 max-w-[3rem] sm:opacity-0 sm:max-w-0 sm:group-hover:opacity-100 sm:group-hover:max-w-[3rem]',
                      )}>
                        <button type="button" disabled={savingCategory} title="שנה שם"
                          onClick={() => { setEditingCategoryId(cat.id); setEditCategoryInput(cat.name); }}
                          className={cn('p-1 rounded transition-colors',
                            form.categoryId === cat.id ? 'hover:bg-white/20 text-white/80 hover:text-white' : 'hover:bg-muted text-muted-foreground hover:text-primary'
                          )}>
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button type="button" disabled={savingCategory} title="מחק קטגוריה"
                          onClick={() => handleDeleteCategory(cat)}
                          className={cn('p-1 rounded transition-colors',
                            form.categoryId === cat.id ? 'hover:bg-white/20 text-white/80 hover:text-white' : 'hover:bg-red-50 text-muted-foreground hover:text-red-500'
                          )}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )
                ))}
                {!addingCategory && (
                  <button type="button" onClick={() => { setAddingCategory(true); setNewCategoryInput(''); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Plus className="h-3.5 w-3.5" />חדשה
                  </button>
                )}
              </div>
              {addingCategory && (
                <div className="flex gap-2 mt-1">
                  <Input autoFocus value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)}
                    placeholder="שם הקטגוריה החדשה..." disabled={savingCategory}
                    className="flex-1 border border-secondary bg-white focus-visible:ring-1 focus-visible:border-secondary"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                      if (e.key === 'Escape') setAddingCategory(false);
                    }} />
                  <button type="button" onClick={handleAddCategory} disabled={savingCategory}
                    className="inline-flex items-center px-3 h-10 rounded-md border border-secondary bg-white text-sm text-primary hover:bg-secondary/10 transition-colors disabled:opacity-50">
                    {savingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => setAddingCategory(false)} disabled={savingCategory}
                    className="inline-flex items-center px-3 h-10 rounded-md border border-input bg-white text-sm text-muted-foreground hover:text-primary transition-colors">
                    ביטול
                  </button>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>תגיות</Label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map(tagName => {
                  const selected = form.tags.includes(tagName);
                  return (
                    <button key={tagName} type="button"
                      onClick={() => field('tags', selected ? form.tags.filter(t => t !== tagName) : [...form.tags, tagName])}
                      className={cn(
                        'inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                        selected ? 'bg-secondary text-primary border-secondary' : 'bg-white text-muted-foreground border-border hover:border-secondary'
                      )}>
                      {tagName}
                    </button>
                  );
                })}
                {!addingTag && (
                  <button type="button" onClick={() => { setAddingTag(true); setNewTagInput(''); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:border-secondary hover:text-primary transition-all">
                    <Plus className="h-3.5 w-3.5" />חדשה
                  </button>
                )}
              </div>
              {addingTag && (
                <div className="flex gap-2 mt-1">
                  <Input autoFocus value={newTagInput} onChange={e => setNewTagInput(e.target.value)}
                    placeholder="שם התגית החדשה..."
                    className="flex-1 border border-secondary bg-white focus-visible:ring-1 focus-visible:border-secondary"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                      if (e.key === 'Escape') setAddingTag(false);
                    }} />
                  <button type="button" onClick={handleAddTag}
                    className="inline-flex items-center px-3 h-10 rounded-md border border-secondary bg-white text-sm text-primary hover:bg-secondary/10 transition-colors">
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setAddingTag(false)}
                    className="inline-flex items-center px-3 h-10 rounded-md border border-input bg-white text-sm text-muted-foreground hover:text-primary transition-colors">
                    ביטול
                  </button>
                </div>
              )}
              {addingTag && <p className="text-xs text-muted-foreground">התגית תיווסף אוטומטית לרשימה בעת השמירה</p>}
            </div>

            {isEdit && form.readTime && (
              <div className="space-y-1.5">
                <Label>זמן קריאה</Label>
                <div className="px-3 py-2 rounded-md border border-border bg-muted text-sm text-muted-foreground font-mono">
                  {form.readTime}
                </div>
                <p className="text-xs text-muted-foreground">נוצר אוטומטית על ידי AI</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>קישור PDF</Label>
              <Input value={form.pdfUrl} onChange={e => field('pdfUrl', e.target.value)}
                placeholder="https://..." dir="ltr"
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary" />
            </div>

            <div className="space-y-1.5">
              <Label>נקודות מפתח</Label>
              <Textarea value={form.keyPoints} onChange={e => field('keyPoints', e.target.value)}
                placeholder="נקודה אחת בכל שורה..." rows={4}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none" />
            </div>

            <div className="space-y-1.5">
              <Label>מקורות</Label>
              <Textarea value={form.sources} onChange={e => field('sources', e.target.value)}
                placeholder="מקורות ורפרנסים..." rows={3}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none" />
            </div>

            {isEdit && (createdByName || updatedByName || linkId) && (
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">מעקב שינויים</p>
                {createdByName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">נוצר על ידי</span>
                    <span className="font-medium text-primary">{createdByName}</span>
                  </div>
                )}
                {updatedByName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">עודכן על ידי</span>
                    <span className="font-medium text-primary">{updatedByName}</span>
                  </div>
                )}
                {linkId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">מזהה קישור</span>
                    <span className="font-mono text-xs text-muted-foreground">{linkId}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">תוכן</p>
              <button type="button" onClick={() => setShowPreview(p => !p)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? 'עריכה' : 'תצוגה מקדימה'}
              </button>
            </div>

            {showPreview ? (
              <div className="prose prose-sm max-w-none min-h-[300px] text-right" dir="rtl">
                {form.fullContent
                  ? <ReactMarkdown disallowedElements={['script', 'iframe', 'object', 'embed']} unwrapDisallowed>{form.fullContent}</ReactMarkdown>
                  : <p className="text-muted-foreground italic">אין תוכן להצגה</p>
                }
              </div>
            ) : (
              <Textarea value={form.fullContent} onChange={e => field('fullContent', e.target.value)}
                placeholder="תוכן המאמר המלא (Markdown נתמך)..."
                rows={20}
                className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none font-mono text-sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
