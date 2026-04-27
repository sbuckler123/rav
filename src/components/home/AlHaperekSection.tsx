import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, FileText, Video, Images, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlHaperek } from '@/hooks/useQueries';
import type { AlHaperekItem, ContentBlock } from '@/api/getAlHaperek';

type BlockType = ContentBlock['type'];

const TYPE_CONFIG: Record<BlockType, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bar: string;
  bg: string;
  iconCls: string;
}> = {
  video:  { label: 'וידאו',  Icon: Video,    bar: 'bg-red-500',    bg: 'bg-red-50',    iconCls: 'text-red-500'    },
  pdf:    { label: 'PDF',    Icon: FileDown, bar: 'bg-orange-500', bg: 'bg-orange-50', iconCls: 'text-orange-500' },
  images: { label: 'תמונות', Icon: Images,   bar: 'bg-green-500',  bg: 'bg-green-50',  iconCls: 'text-green-500'  },
  text:   { label: 'טקסט',  Icon: FileText, bar: 'bg-blue-500',   bg: 'bg-blue-50',   iconCls: 'text-blue-500'   },
};

function primaryType(blocks: ContentBlock[]): BlockType | null {
  for (const t of ['video', 'pdf', 'images', 'text'] as BlockType[]) {
    if (blocks.some(b => b.type === t)) return t;
  }
  return null;
}

function ContentTypeBadge({ blocks }: { blocks: ContentBlock[] }) {
  const t = primaryType(blocks);
  if (!t) return null;
  const { label, Icon, bg, iconCls } = TYPE_CONFIG[t];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md ${bg} ${iconCls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function formatDate(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ItemCard({ item }: { item: AlHaperekItem }) {
  const t = primaryType(item.blocks);
  const barColor = t ? TYPE_CONFIG[t].bar : 'bg-border';

  return (
    <Link to={`/al-haperek/${item.linkId}`} className="block group h-full">
      <div className="flex flex-col h-full bg-white rounded-xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className={`h-1 w-full flex-shrink-0 ${barColor}`} />
        <div className="flex flex-col flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <ContentTypeBadge blocks={item.blocks} />
            {item.date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <CalendarDays className="h-3 w-3" />
                {formatDate(item.date)}
              </span>
            )}
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">{tag}</Badge>
              ))}
            </div>
          )}
          <h3 className="font-serif font-bold text-base sm:text-lg leading-snug text-primary group-hover:text-secondary transition-colors line-clamp-2 flex-1">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
              {item.summary}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function AlHaperekSection() {
  const { data, isLoading } = useAlHaperek();
  const items = (data?.items ?? []).slice(0, 3);

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="bg-[#F7F4EE] py-12 sm:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-secondary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">על הפרק</h2>
          </div>
          <Link to="/al-haperek">
            <Button variant="outline" size="sm" className="gap-2 text-sm hidden sm:flex bg-white">
              לכל הפריטים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-muted animate-pulse h-44" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => <ItemCard key={item.linkId} item={item} />)}
          </div>
        )}

        <div className="text-center mt-6 sm:hidden">
          <Link to="/al-haperek">
            <Button variant="outline" className="gap-2 w-full min-h-[44px] bg-white">
              לכל הפריטים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
