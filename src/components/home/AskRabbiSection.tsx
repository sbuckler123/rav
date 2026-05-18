import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, HelpCircle, CalendarDays, ArrowLeft, ChevronLeft } from 'lucide-react';
import { getCategories } from '@/api/getCategories';
import { getPublishedQuestions } from '@/api/getPublishedQuestions';

type Question = Awaited<ReturnType<typeof getPublishedQuestions>>['questions'][number];

function formatDate(raw: any): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function QuestionCard({ question, categoryName }: { question: Question; categoryName: string | null }) {
  return (
    <Link to={`/shut#q-${question.id}`} className="block group h-full">
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">

        {/* Top accent */}
        <div className="h-1 bg-gradient-to-l from-secondary/60 via-secondary to-secondary/60 flex-shrink-0" />

        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">

          {/* Meta row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {categoryName && (
                <span className="text-[11px] font-semibold bg-secondary/15 text-secondary border border-secondary/25 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {categoryName}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                {question.answers.length} {question.answers.length === 1 ? 'תשובה' : 'תשובות'}
              </span>
            </div>
            {question.createdAt && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 flex-shrink-0 mt-0.5">
                <CalendarDays className="h-3 w-3 flex-shrink-0" />
                {formatDate(question.createdAt)}
              </span>
            )}
          </div>

          {/* Question body */}
          <div className="flex gap-2.5 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest mb-1">שאלה</p>
              <p className="text-sm leading-relaxed text-primary/90 line-clamp-3 break-words">
                {question.questionContent}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-3 border-t border-dashed border-border min-h-[36px]">
            <span className="text-xs font-semibold text-secondary flex items-center gap-1 group-hover:underline">
              לתשובה המלאה
              <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" />
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}

export default function AskRabbiSection() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then(r => setCategories(r.categories)).catch(() => {});
    getPublishedQuestions({})
      .then(r => {
        const sorted = [...r.questions].sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setQuestions(sorted.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 sm:py-16 bg-background" dir="rtl">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-secondary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">שאלות שנשאלו לאחרונה</h2>
          </div>
          <Link to="/shut">
            <Button variant="outline" size="sm" className="gap-2 text-sm hidden sm:flex">
              לכל השאלות
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm">אין שאלות מפורסמות כרגע</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                categoryName={q.category ? (categories.find(c => c.id === q.category)?.name ?? null) : null}
              />
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link to="/shut">
            <Button variant="outline" className="w-full gap-2 min-h-[44px]">
              לכל השאלות
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
