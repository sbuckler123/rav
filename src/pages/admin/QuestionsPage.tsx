import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircleQuestion, Search, Clock, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import { getAllQuestions, type AdminQuestion } from '@/api/adminQuestionsApi';
import { getCategories } from '@/api/getCategories';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { label: 'הכל',   value: 'all' },
  { label: 'ממתין', value: 'ממתין' },
  { label: 'נענה',  value: 'נענה' },
  { label: 'נדחה',  value: 'נדחה' },
];

function statusBadge(status?: string) {
  switch (status) {
    case 'נענה':  return <Badge className="bg-green-100 text-green-800 border-green-200">נענה</Badge>;
    case 'נדחה':  return <Badge className="bg-red-100 text-red-800 border-red-200">נדחה</Badge>;
    default:      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">ממתין</Badge>;
  }
}

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

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    Promise.all([getAllQuestions(), getCategories()])
      .then(([{ questions }, { categories }]) => {
        setQuestions(questions);
        setCategories(categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
          <MessageCircleQuestion className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-primary">שאלות ותשובות</h1>
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
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם או תוכן..."
            className="pr-9 border border-input bg-white"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 flex-shrink-0">
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
                {/* Status dot */}
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  q.status === 'נענה' ? 'bg-green-500' :
                  q.status === 'נדחה' ? 'bg-red-500' : 'bg-amber-400'
                )} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {q.questionContent}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.askerName && <span>{q.askerName}</span>}
                    {q.askerName && q.createdAt && <span className="mx-1.5">·</span>}
                    {q.createdAt && <span>{q.createdAt}</span>}
                    {getCategoryName(q.category) && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span>{getCategoryName(q.category)}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {statusBadge(q.status)}
                  {q.answers.length > 0 && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {q.answers.length} תשובות
                    </span>
                  )}
                  <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
