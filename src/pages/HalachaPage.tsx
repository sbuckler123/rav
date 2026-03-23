import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Share2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Breadcrumbs from '@/components/Breadcrumbs';
import { HALACHA_LIST, CATEGORIES, YEARS, getCategoryColor, type HalachaListItem } from '@/lib/halacha';
const ITEMS_PER_PAGE = 6;
const SORT_OPTIONS = [{
  value: 'date-desc',
  label: 'תאריך (חדש לישן)'
}, {
  value: 'date-asc',
  label: 'תאריך (ישן לחדש)'
}, {
  value: 'title',
  label: 'נושא (א-ת)'
}];
export default function HalachaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    let list = [...HALACHA_LIST];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(h => h.title.toLowerCase().includes(q) || h.excerpt.toLowerCase().includes(q) || h.category.toLowerCase().includes(q));
    }
    if (categoryFilter.length > 0) {
      list = list.filter(h => categoryFilter.includes(h.category));
    }
    if (yearFilter) {
      list = list.filter(h => h.dateHebrew.includes(yearFilter));
    }
    if (sort === 'date-asc') list = [...list].reverse();
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'he'));
    return list;
  }, [searchQuery, categoryFilter, yearFilter, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page]);
  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    setPage(1);
  };
  const clearAll = () => {
    setSearchQuery('');
    setCategoryFilter([]);
    setYearFilter('');
    setSort('date-desc');
    setPage(1);
  };
  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    HALACHA_LIST.forEach(h => {
      c[h.category] = (c[h.category] ?? 0) + 1;
    });
    return c;
  }, []);
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
      

        {/* Page Title Section - Dark Royal Blue Background */}
        <section className="w-full py-12 px-4 md:px-8 mb-8 rounded-lg bg-primary">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              פסקי הלכה
            </h1>
            <p className="text-white/90 font-sans text-base md:text-lg mb-8">
              מאגר פסקי ההלכה של הרב הראשי לישראל — חיפוש, עיון והורדה
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input type="search" placeholder="חפש לפי נושא, מילת מפתח או סימן בשו״ע" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className='pr-12 bg-white border-0 h-12 text-base rounded-md' />
              </div>
              <Button onClick={() => setPage(1)} className='text-secondary-foreground bg-secondary h-12 px-6 font-semibold rounded-lg'>חיפוש</Button>
            </div>
          </div>
        </section>
  <Breadcrumbs items={[{
        label: 'דף הבית',
        href: '/'
      }, {
        label: 'פסקי הלכה'
      }]} />
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-8">
          {/* Main Feed - Left Side */}
          <div>
            {/* Results Count & Sort Bar */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-foreground font-medium">
                נמצאו <span className="font-bold">{filtered.length}</span> תוצאות
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">מיין לפי:</span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[160px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Halacha Cards */}
            <div className="space-y-4 mb-8">
              {pageItems.map(halacha => {
              const color = getCategoryColor(halacha.category);
              return <HalachaCard key={halacha.id} halacha={halacha} color={color} />;
            })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && <div className="flex justify-center items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="h-10 w-10 rounded-full">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {Array.from({
              length: Math.min(totalPages, 7)
            }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              if (pageNum > totalPages) return null;
              return <Button key={pageNum} onClick={() => setPage(pageNum)} className={`h-10 w-10 rounded-full ${pageNum === page ? 'text-white' : 'bg-white text-foreground hover:bg-gray-100'}`} style={pageNum === page ? {
                backgroundColor: '#002D72'
              } : undefined}>
                      {pageNum}
                    </Button>;
            })}
                {totalPages > 7 && page < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                {totalPages > 7 && <Button onClick={() => setPage(totalPages)} className={`h-10 w-10 rounded-full ${page === totalPages ? 'text-white' : 'bg-white text-foreground hover:bg-gray-100'}`} style={page === totalPages ? {
              backgroundColor: '#002D72'
            } : undefined}>
                    {totalPages}
                  </Button>}
                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-10 w-10 rounded-full">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>}
          </div>

          {/* Filter Sidebar - Right Side */}
          <aside className="lg:order-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  סינון מתקדם
                </h3>
                <button onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  נקה הכל
                </button>
              </div>

              {/* Categories Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3">נושא</h4>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded -mr-2">
                      <input type="checkbox" checked={categoryFilter.includes(cat)} onChange={() => toggleCategoryFilter(cat)} className="w-4 h-4 border-gray-300 rounded text-[#002D72] focus:ring-[#002D72]" />
                      <span className="text-sm text-foreground">
                        {cat} ({categoryCounts[cat] || 0})
                      </span>
                    </label>)}
                </div>
              </div>

              {/* Year Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3">שנה</h4>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="כל השנים" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">סטטוס פסק</h4>
                <div className="flex gap-2 flex-wrap">
                  <button className="px-4 py-2 rounded text-sm font-medium transition-colors text-white" style={{
                  backgroundColor: '#002D72'
                }}>
                    הכל
                  </button>
                  <button className="px-4 py-2 rounded text-sm font-medium transition-colors bg-gray-100 text-foreground hover:bg-gray-200">
                    סופי
                  </button>
                  <button className="px-4 py-2 rounded text-sm font-medium transition-colors bg-gray-100 text-foreground hover:bg-gray-200">
                    להערות
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>;
}
function HalachaCard({
  halacha,
  color
}: {
  halacha: HalachaListItem;
  color: string;
}) {
  // Extract tags from category and content
  const tags = [`#${halacha.category}`, halacha.category === 'שבת' ? '#שבת_ומועדים' : null, halacha.category === 'כשרות' ? '#כשרות' : null, halacha.category === 'ברכות' ? '#ברכות' : null].filter(Boolean) as string[];
  return <article className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative flex">
      {/* Action Sidebar - Left Edge */}
      <div className="w-14 flex flex-col items-center justify-start pt-6 gap-4 border-l border-gray-200 bg-gray-50/50">
        <Link to={`/halacha/${halacha.slug}`} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-[#002D72] transition-colors group">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-xs text-gray-600">PDF</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-[#002D72] transition-colors group" aria-label="שתף">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <Share2 className="h-4 w-4" />
          </div>
          <span className="text-xs text-gray-600">שתף</span>
        </button>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            {/* Category Badge & Date */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="inline-block rounded px-2.5 py-1 text-xs font-medium text-white" style={{
              backgroundColor: color
            }}>
                {halacha.category}
              </span>
              <span className="text-sm text-muted-foreground">
                {halacha.dateHebrew}
              </span>
            </div>

            {/* Bold Headline */}
            <Link to={`/halacha/${halacha.slug}`}>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-3 hover:text-[#002D72] transition-colors">
                {halacha.title}
              </h2>
            </Link>

            {/* Summary */}
            <p className="text-foreground text-sm md:text-base leading-relaxed mb-4 line-clamp-3">
              {halacha.excerpt}
            </p>

            {/* Bottom Tags */}
            {tags.length > 0 && <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag, idx) => <span key={idx} className="inline-block px-2.5 py-1 rounded-full text-xs border border-gray-300 bg-white text-muted-foreground">
                    {tag}
                  </span>)}
              </div>}
          </div>
        </div>
      </div>
    </article>;
}