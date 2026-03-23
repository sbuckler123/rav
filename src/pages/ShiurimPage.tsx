import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Clock, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { getShiurim, type ShiurEvent } from '@/api/getShiurim';

const dateFilters = [
  { label: 'השבוע', value: 'week' },
  { label: 'החודש', value: 'month' },
  { label: 'הכל', value: 'all' },
];

const categoryColors: Record<string, string> = {
  'שיעור': 'bg-secondary/10 text-secondary border-secondary/20',
  'כנס': 'bg-primary/10 text-primary border-primary/20',
  'הרצאה': 'bg-secondary/10 text-secondary border-secondary/20',
  'אירוע': 'bg-primary/10 text-primary border-primary/20',
};

const categoryBorder: Record<string, string> = {
  'שיעור': 'border-r-secondary',
  'כנס': 'border-r-primary',
  'הרצאה': 'border-r-secondary',
  'אירוע': 'border-r-primary',
};

const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const monthNames = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

export default function ShiurimPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [events, setEvents] = useState<ShiurEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getShiurim()
      .then(({ shiurim }) => setEvents(shiurim))
      .catch(() => setError('שגיאה בטעינת השיעורים'))
      .finally(() => setLoading(false));
  }, []);

  const allCategories = useMemo(() => ['הכל', ...new Set(events.map((e) => e.category).filter(Boolean))], [events]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return events.filter((event) => {
      const q = searchQuery.trim().toLowerCase();
      const searchMatch = !q || event.title.toLowerCase().includes(q) || event.description.toLowerCase().includes(q) || event.location.toLowerCase().includes(q);
      const categoryMatch = selectedCategory === 'הכל' || event.category === selectedCategory;
      const eventDate = parseDate(event.date);
      let dateMatch = true;
      if (selectedDateFilter === 'week') dateMatch = eventDate >= now && eventDate <= weekFromNow;
      else if (selectedDateFilter === 'month') dateMatch = eventDate >= now && eventDate <= monthFromNow;
      return searchMatch && categoryMatch && dateMatch;
    });
  }, [events, searchQuery, selectedCategory, selectedDateFilter]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'הכל' || selectedDateFilter !== 'all';
  const clearAllFilters = () => { setSearchQuery(''); setSelectedCategory('הכל'); setSelectedDateFilter('all'); };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="לוח שיעורים" subtitle="כל השיעורים וההרצאות הקרובים" />
      <div className="container mx-auto px-4 max-w-7xl py-16 text-center text-muted-foreground">טוען שיעורים...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background">
      <PageHeader title="לוח שיעורים" subtitle="כל השיעורים וההרצאות הקרובים" />
      <div className="container mx-auto px-4 max-w-7xl py-16 text-center text-destructive">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="לוח שיעורים" subtitle="כל השיעורים וההרצאות הקרובים" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Events List */}
          <section className="flex-1 order-2 lg:order-1 min-w-0" aria-label="רשימת שיעורים">

            {/* Section header */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 pb-4 border-b">
              <h2 className="font-serif font-bold text-base sm:text-lg text-primary">שיעורים קרובים</h2>
              <span className="bg-secondary/15 text-secondary text-xs font-semibold px-2.5 py-1 rounded-full">
                {filteredEvents.length}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mr-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors min-h-[36px] sm:min-h-0"
                >
                  <X className="h-3 w-3" />
                  נקה סינון
                </button>
              )}
            </div>

            {/* Empty state */}
            {filteredEvents.length === 0 ? (
              <Card className="text-center py-12 sm:py-16 bg-[#FAF8F2]">
                <CardContent>
                  <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">לא נמצאו שיעורים התואמים לחיפוש</p>
                  <Button variant="outline" onClick={clearAllFilters} className="min-h-[44px]">נקה פילטרים</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredEvents.map((event) => {
                  const [day, month] = event.date.split('.');
                  const monthLabel = monthNames[parseInt(month) - 1];
                  const borderClass = categoryBorder[event.category] ?? 'border-r-primary';
                  const badgeClass = categoryColors[event.category] ?? 'bg-primary/10 text-primary border-primary/20';

                  return (
                    <Link key={event.id} to={`/shiurim/${event.linkId}`}>
                    <Card
                      className={`border-r-4 ${borderClass} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group`}
                    >
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Date column */}
                          <div className="flex-shrink-0 w-16 sm:w-24 flex flex-col items-center justify-center py-4 sm:py-5 px-1 sm:px-2 bg-muted/30">
                            <span className="text-2xl sm:text-4xl font-bold text-primary leading-none">{day}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">{monthLabel}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 p-3 sm:p-5">
                            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                              <h2 className="font-bold text-sm sm:text-base lg:text-lg leading-snug group-hover:text-secondary transition-colors">
                                {event.title}
                              </h2>
                              <span className={`text-[10px] sm:text-xs border px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${badgeClass}`}>
                                {event.category}
                              </span>
                            </div>

                            <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                              {event.description}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-4 sm:gap-y-1.5 text-xs sm:text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary flex-shrink-0" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 min-h-[36px] sm:min-h-0 border-secondary/40 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-colors"
                            >
                              הוסף ליומן
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 order-1 lg:order-2" aria-label="סינון שיעורים">
            <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4">

              {/* Search */}
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    חיפוש שיעור
                  </h3>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="חפש לפי שם, מיקום..."
                      className="w-full pr-9 bg-muted/30 border-0 focus-visible:ring-1 min-h-[44px] sm:min-h-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="חיפוש שיעורים"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1"
                        aria-label="נקה חיפוש"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Category filter */}
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm text-primary mb-3">סוג אירוע</h3>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-full text-sm font-medium border transition-all ${
                          selectedCategory === cat
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/30 text-muted-foreground border-transparent hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Date filter */}
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    טווח תאריכים
                  </h3>
                  <div className="flex rounded-lg overflow-hidden border">
                    {dateFilters.map((filter, i) => (
                      <button
                        key={filter.value}
                        onClick={() => setSelectedDateFilter(filter.value)}
                        className={`flex-1 py-2 min-h-[44px] sm:min-h-[36px] text-xs sm:text-sm font-medium transition-colors ${
                          i < dateFilters.length - 1 ? 'border-l' : ''
                        } ${
                          selectedDateFilter === filter.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-transparent text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Clear all */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full text-sm text-muted-foreground hover:text-destructive flex items-center justify-center gap-1.5 py-2 min-h-[44px] sm:min-h-0 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  נקה את כל הפילטרים
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
