import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageCircleQuestion, Search, Clock, CheckCircle2, XCircle, ChevronLeft, Plus, Loader2 } from 'lucide-react';
import { getAllQuestions, createQuestion, submitReply, type AdminQuestion } from '@/api/adminQuestionsApi';
import { getCategories } from '@/api/getCategories';
import { airtableGetFieldChoices } from '@/api/airtable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn, formatAdminDate } from '@/lib/utils';

const STATUS_TABS = [
  { label: 'הכל',   value: 'all' },
  { label: 'ממתין', value: 'ממתין' },
  { label: 'נענה',  value: 'נענה' },
  { label: 'נדחה',  value: 'נדחה' },
];


function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  content: '',
  askerName: '',
  category: '',
  status: 'ממתין',
  consentToPublish: false,
  approvedForPublish: false,
  answerContent: '',
  answerWriterType: 'רב',
};

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [writerTypeOptions, setWriterTypeOptions] = useState<string[]>([]);

  function loadData() {
    setLoading(true);
    Promise.all([getAllQuestions(), getCategories()])
      .then(([{ questions }, { categories }]) => {
        setQuestions(questions);
        setCategories(categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    airtableGetFieldChoices('תשובות', 'סוג כותב')
      .then(choices => {
        setWriterTypeOptions(choices);
        if (choices.length > 0) setForm(f => ({ ...f, answerWriterType: choices[0] }));
      })
      .catch(() => {});
  }, []);

  const getCategoryName = (id?: string) =>
    id ? (categories.find(c => c.id === id)?.name ?? '') : '';

  const filtered = questions.filter(q => {
    const matchTab = activeTab === 'all' || q.status === activeTab;
    const matchSearch = !search ||
      q.questionContent.includes(search) ||
      (q.askerName ?? '').includes(search);
    return matchTab && matchSearch;
  });

  const totalPending  = questions.filter(q => q.status === 'ממתין').length;
  const totalAnswered = questions.filter(q => q.status === 'נענה').length;
  const totalRejected = questions.filter(q => q.status === 'נדחה').length;

  async function handleCreate() {
    if (!form.content.trim()) { toast.error('תוכן השאלה הוא שדה חובה'); return; }
    setSaving(true);
    try {
      const { id } = await createQuestion({
        content: form.content.trim(),
        askerName: form.askerName,
        category: form.category || undefined,
        status: form.answerContent.trim() ? 'נענה' : form.status,
        consentToPublish: form.consentToPublish,
        approvedForPublish: form.approvedForPublish,
      });
      if (form.answerContent.trim()) {
        await submitReply({ questionId: id, content: form.answerContent.trim(), writerType: form.answerWriterType });
      }
      toast.success('השאלה נוצרה בהצלחה');
      setShowDialog(false);
      setForm(EMPTY_FORM);
      navigate(`/admin/questions/${id}`);
    } catch {
      toast.error('שגיאה ביצירת השאלה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageCircleQuestion className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-primary flex-1 min-w-0 truncate">שאלות ותשובות</h1>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-secondary text-primary hover:bg-secondary/90 inline-flex items-center gap-2 h-11 flex-shrink-0"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="hidden xs:inline sm:inline">שאלה חדשה</span>
          <span className="sm:hidden">חדשה</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="סה״כ שאלות"  value={questions.length} icon={MessageCircleQuestion} color="bg-primary/10 text-primary" />
        <StatCard label="ממתינות לתשובה" value={totalPending}  icon={Clock}          color="bg-amber-100 text-amber-700" />
        <StatCard label="נענו"          value={totalAnswered} icon={CheckCircle2}    color="bg-green-100 text-green-700" />
        <StatCard label="נדחו"          value={totalRejected} icon={XCircle}         color="bg-red-100 text-red-700" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם או תוכן..."
            className="pr-9 border border-input bg-white"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 flex-shrink-0 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === tab.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            לא נמצאו שאלות
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(q => (
              <Link
                key={q.id}
                to={`/admin/questions/${q.id}`}
                className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-muted/40 transition-colors group"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  q.status === 'נענה' ? 'bg-green-500' :
                  q.status === 'נדחה' ? 'bg-red-500' : 'bg-amber-400'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {q.questionContent}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {q.askerName && <span>{q.askerName}</span>}
                    {q.askerName && q.createdAt && <span className="mx-1.5">·</span>}
                    {q.createdAt && <span>{formatAdminDate(q.createdAt)}</span>}
                    {getCategoryName(q.category) && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span>{getCategoryName(q.category)}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0',
                    q.status === 'נענה' ? 'bg-green-100 text-green-800 border-green-200' :
                    q.status === 'נדחה' ? 'bg-red-100 text-red-800 border-red-200' :
                                          'bg-amber-100 text-amber-800 border-amber-200',
                  )}>
                    {q.status ?? 'ממתין'}
                  </span>
                  {q.answers.length > 0 && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {q.answers.length} תשובות
                    </span>
                  )}
                  <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6" dir="rtl">
            <h2 className="text-lg font-bold text-primary mb-4 sm:mb-5">שאלה חדשה</h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>תוכן השאלה <span className="text-red-500">*</span></Label>
                <Textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="כתוב את השאלה כאן..."
                  rows={4}
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label>שם השואל</Label>
                <Input
                  value={form.askerName}
                  onChange={e => setForm(f => ({ ...f, askerName: e.target.value }))}
                  placeholder="שם השואל (אופציונלי)"
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary"
                />
              </div>

              <div className="space-y-1.5">
                <Label>קטגוריה</Label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-secondary"
                >
                  <option value="">ללא קטגוריה</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>סטטוס</Label>
                <div className="flex gap-2">
                  {['ממתין', 'נענה', 'נדחה'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                        form.status === s
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-muted-foreground border-border hover:border-primary'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.consentToPublish}
                    onChange={e => setForm(f => ({ ...f, consentToPublish: e.target.checked }))}
                    className="rounded"
                  />
                  הסכמה לפרסום
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.approvedForPublish}
                    onChange={e => setForm(f => ({ ...f, approvedForPublish: e.target.checked }))}
                    className="rounded"
                  />
                  מאושר לפרסום
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>תשובה ראשונה (אופציונלי)</Label>
                <Textarea
                  value={form.answerContent}
                  onChange={e => setForm(f => ({ ...f, answerContent: e.target.value }))}
                  placeholder="כתוב תשובה ראשונה..."
                  rows={4}
                  className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none"
                />
              </div>

              {form.answerContent.trim() && (
                <div className="space-y-1.5">
                  <Label>סוג כותב</Label>
                  <select
                    value={form.answerWriterType}
                    onChange={e => setForm(f => ({ ...f, answerWriterType: e.target.value }))}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-secondary"
                  >
                    {writerTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? 'יוצר...' : 'צור שאלה'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowDialog(false); setForm(EMPTY_FORM); }}
                disabled={saving}
                className="min-h-[44px]"
              >
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
