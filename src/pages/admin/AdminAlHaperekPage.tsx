import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/apiFetch';
import { QUERY_KEYS } from '@/hooks/useQueries';
import { Newspaper, Plus, Pencil, Trash2, Loader2, Search, CalendarDays, Video, Images, FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { ContentBlock } from '@/api/getAlHaperek';

interface AdminItem {
  id: string;
  linkId: string;
  title: string;
  summary: string;
  date: string;
  status: string;
  tags: string[];
  blocks: ContentBlock[];
}

function BlockTypeIcons({ blocks }: { blocks: ContentBlock[] }) {
  const types = new Set(blocks.map(b => b.type));
  return (
    <span className="flex items-center gap-1">
      {types.has('video')  && <Video    className="h-3.5 w-3.5 text-muted-foreground" aria-label="וידאו"  />}
      {types.has('images') && <Images   className="h-3.5 w-3.5 text-muted-foreground" aria-label="תמונות" />}
      {types.has('pdf')    && <FileDown className="h-3.5 w-3.5 text-muted-foreground" aria-label="PDF"    />}
      {types.has('text')   && <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-label="טקסט"  />}
    </span>
  );
}

export default function AdminAlHaperekPage() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<AdminItem[]>('/api/admin?section=al-haperek')
      .then(setItems)
      .catch(() => toast.error('שגיאה בטעינת הנתונים'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin?section=al-haperek&id=${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('הפריט נמחק');
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alHaperek });
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('שגיאה במחיקה');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = items.filter(i =>
    !search || i.title.includes(search) || i.summary.includes(search) || i.tags.some(t => t.includes(search))
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Newspaper className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-primary">על הפרק</h1>
          <p className="text-sm text-muted-foreground">{items.length} פריטים</p>
        </div>
        <Button asChild className="h-11 bg-secondary text-primary hover:bg-secondary/90 flex-shrink-0">
          <Link to="/admin/al-haperek/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">פריט חדש</span>
            <span className="sm:hidden">חדש</span>
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי כותרת, תגית..." className="pr-9 border border-input bg-white" />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 px-5 flex items-center gap-3">
                <div className="h-4 bg-muted animate-pulse rounded w-48" />
                <div className="h-5 bg-muted animate-pulse rounded w-16 mr-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">לא נמצאו פריטים</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-primary truncate text-sm">{item.title}</p>
                    <BlockTypeIcons blocks={item.blocks} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                    {item.date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />{item.date}
                      </span>
                    )}
                    {item.tags.slice(0, 2).map(t => (
                      <span key={t} className="bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">{t}</span>
                    ))}
                  </div>
                </div>

                <span className={`h-2 w-2 rounded-full flex-shrink-0 sm:hidden ${item.status === 'פורסם' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded hidden sm:block flex-shrink-0 ${item.status === 'פורסם' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {item.status}
                </span>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Link
                    to={`/admin/al-haperek/${item.id}/edit`}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    title="ערוך"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="מחק"
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
            <DialogTitle>מחיקת פריט</DialogTitle>
            <DialogDescription>
              האם למחוק את <strong>"{deleteTarget?.title}"</strong>? פעולה זו אינה ניתנת לביטול.
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
