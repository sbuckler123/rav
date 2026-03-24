import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { airtableFetch, airtableDelete } from '@/api/airtable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

interface AdminArticle {
  id: string;
  title: string;
  journal: string;
  yeshiva: string;
  yearNum: number;
  categories: string[];
  abstract: string;
  linkId: string;
  status: string;
}

function extractField(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.value != null) return String(val.value).trim();
  return '';
}

async function fetchArticles(): Promise<AdminArticle[]> {
  const data = await airtableFetch('מאמרים', {}, [{ field: 'שנה לועזית', direction: 'desc' }]);
  return data.records.map((r: any) => {
    const f = r.fields;
    return {
      id: r.id,
      title: extractField(f['כותרת']),
      journal: extractField(f['כתב עת']),
      yeshiva: extractField(f['מוסד']),
      yearNum: f['שנה לועזית'] ?? 0,
      categories: Array.isArray(f['קטגוריות']) ? f['קטגוריות'] : (f['קטגוריות'] ? [f['קטגוריות']] : []),
      abstract: extractField(f['תקציר']),
      linkId: extractField(f['מזהה קישור']),
      status: extractField(f['סטטוס']) || 'לא פעיל',
    };
  });
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    fetchArticles()
      .then(setArticles)
      .catch(() => toast.error('שגיאה בטעינת מאמרים'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await airtableDelete('מאמרים', deleteTarget.id);
      toast.success('המאמר נמחק');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = articles.filter(a =>
    !search || a.title.includes(search) || a.journal.includes(search) || a.yeshiva.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-primary">מאמרים</h1>
          <p className="text-sm text-muted-foreground">{articles.length} מאמרים</p>
        </div>
        <Link
          to="/admin/articles/new"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-md bg-secondary text-primary hover:bg-secondary/90 text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          מאמר חדש
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי כותרת, כתב עת או מוסד..."
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
                <div className="h-4 bg-muted animate-pulse rounded w-24 mr-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">לא נמצאו מאמרים</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary truncate text-sm sm:text-base">{a.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                    {a.yearNum > 0 && <span className="text-xs text-muted-foreground">{a.yearNum}</span>}
                    {a.journal && <span className="text-xs text-muted-foreground hidden sm:inline">{a.journal}</span>}
                    {a.categories.slice(0, 2).map(c => (
                      <Badge key={c} variant="secondary" className="text-xs hidden sm:inline-flex">{c}</Badge>
                    ))}
                  </div>
                </div>
                <Badge className={a.status === 'פעיל'
                  ? 'bg-green-100 text-green-800 border-green-200 text-xs flex-shrink-0'
                  : 'bg-muted text-muted-foreground border-border text-xs flex-shrink-0'}>
                  {a.status}
                </Badge>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Link
                    to={`/admin/articles/${a.id}/edit`}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => setDeleteTarget(a)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="relative">
          <DialogClose onClose={() => setDeleteTarget(null)} />
          <DialogHeader>
            <DialogTitle>מחיקת מאמר</DialogTitle>
            <DialogDescription>
              האם למחוק את המאמר <strong>"{deleteTarget?.title}"</strong>? פעולה זו אינה ניתנת לביטול.
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
