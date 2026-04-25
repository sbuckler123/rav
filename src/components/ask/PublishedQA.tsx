import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ChevronDown, ChevronUp, Send, BookOpen, HelpCircle, CalendarDays, ChevronRight, ChevronLeft, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { submitReply } from '@/api/submitReply';
import type { getPublishedQuestions } from '@/api/getPublishedQuestions';

type GetPublishedQuestionsOutputType = Awaited<ReturnType<typeof getPublishedQuestions>>;
type Question = GetPublishedQuestionsOutputType['questions'][0];
type Answer = Question['answers'][0];

const CHAR_LIMIT = 300;
const PAGE_SIZE = 10;

interface Props {
  questions: Question[];
  categories: { id: string; name: string }[];
}

function formatDate(raw: string | undefined): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jerusalem',
  });
}

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  if (current > 3) pages.push('ellipsis');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > CHAR_LIMIT;

  return (
    <div>
      <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${className ?? ''}`}>
        {isLong && !expanded ? text.slice(0, CHAR_LIMIT) + '...' : text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="mt-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1 min-h-[36px] focus:outline-none"
        >
          {expanded
            ? <><ChevronUp className="h-3 w-3" />הצג פחות</>
            : <><ChevronDown className="h-3 w-3" />קרא עוד</>}
        </button>
      )}
    </div>
  );
}

function AnswerBlock({ answer }: { answer: Answer }) {
  const isRabbi = answer.writerType === 'רב';

  return (
    <div className="flex gap-2 sm:gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isRabbi ? 'bg-primary' : 'bg-muted'}`}>
          {isRabbi
            ? <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" />
            : <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
          }
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-semibold ${isRabbi ? 'text-primary' : 'text-muted-foreground'}`}>
            {answer.writerType || 'משיב'}
          </span>
          {answer.date && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(answer.date)}
            </span>
          )}
        </div>
        <div className={`rounded-xl p-3 sm:p-3.5 text-sm leading-relaxed break-words ${isRabbi ? 'bg-[#F7F4EE] border border-secondary/15' : 'bg-muted/30 border border-border'}`}>
          {answer.title && (
            <p className={`text-sm font-semibold mb-2 ${isRabbi ? 'text-primary' : 'text-foreground'}`}>
              {answer.title}
            </p>
          )}
          <ExpandableText text={answer.content} />
        </div>
      </div>
    </div>
  );
}

export default function PublishedQA({ questions, categories }: Props) {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const activeCategories = categories.filter(c =>
    questions.some(q => q.category === c.id)
  );

  const sorted = [...questions].sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const term = search.trim().toLowerCase();

  const filtered = sorted.filter(q => {
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    const matchesSearch = !term ||
      q.questionContent.toLowerCase().includes(term) ||
      q.answers.some(a => a.content.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Navigate to the correct page when deep-linking via hash (#q-<id>)
  useEffect(() => {
    if (questions.length === 0 || !window.location.hash) return;
    const targetId = window.location.hash.replace('#q-', '');
    const idx = sorted.findIndex(q => q.id === targetId);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
    setPage(targetPage);
    setTimeout(() => {
      const el = document.getElementById(`q-${targetId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, [questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    document.getElementById('qa-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-25" />
        <p className="text-sm">אין שאלות מפורסמות כרגע.</p>
      </div>
    );
  }

  const pageRange = getPageRange(page, totalPages);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="חיפוש בשאלות ותשובות..."
          className="w-full rounded-xl border border-input bg-white pr-10 pl-10 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors min-h-[48px]"
          aria-label="חיפוש שאלות"
          dir="rtl"
        />
        {search && (
          <button
            onClick={clearSearch}
            aria-label="נקה חיפוש"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      {activeCategories.length > 0 && (
        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium border transition-all min-h-[44px] ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-muted-foreground border-input hover:border-primary/40 hover:text-primary'
            }`}
          >
            הכל
            <span className={`mr-1.5 text-xs ${selectedCategory === 'all' ? 'text-secondary' : 'text-muted-foreground'}`}>
              ({sorted.length})
            </span>
          </button>
          {activeCategories.map(c => {
            const count = sorted.filter(q => q.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium border transition-all min-h-[44px] ${
                  selectedCategory === c.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-input hover:border-primary/40 hover:text-primary'
                }`}
              >
                {c.name}
                <span className={`mr-1.5 text-xs ${selectedCategory === c.id ? 'text-secondary' : 'text-muted-foreground'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Questions */}
      {visible.length >= 0 && (
        <>
          {filtered.length === 0 && (search || selectedCategory !== 'all') && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-25" />
              <p className="text-sm">
                {search ? `לא נמצאו תוצאות עבור "${search}"` : 'אין שאלות בקטגוריה זו.'}
              </p>
              {(search || selectedCategory !== 'all') && (
                <button
                  onClick={() => { clearSearch(); setSelectedCategory('all'); }}
                  className="mt-3 text-xs text-secondary hover:text-secondary/80 underline underline-offset-2"
                >
                  נקה סינון
                </button>
              )}
            </div>
          )}
          {visible.map(q => (
            <QuestionCard key={q.id} question={q} categories={categories} />
          ))}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-1.5 pt-4"
          aria-label="דפדוף שאלות"
          dir="rtl"
        >
          {/* Prev */}
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            aria-label="עמוד קודם"
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-input bg-white text-muted-foreground hover:bg-muted/40 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Page numbers — desktop */}
          <div className="hidden sm:flex items-center gap-1">
            {pageRange.map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-muted-foreground text-sm select-none">
                  ···
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  aria-label={`עמוד ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    p === page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-input bg-white text-muted-foreground hover:bg-muted/40 hover:text-primary'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Mobile: current / total */}
          <span className="sm:hidden text-sm font-medium text-primary px-3 min-w-[72px] text-center">
            {page} / {totalPages}
          </span>

          {/* Next */}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="עמוד הבא"
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-input bg-white text-muted-foreground hover:bg-muted/40 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </nav>
      )}

      {/* Result count */}
      {totalPages > 1 && (
        <p className="text-center text-xs text-muted-foreground pb-2">
          מציג {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} מתוך {filtered.length} שאלות
        </p>
      )}
    </div>
  );
}

function QuestionCard({ question, categories }: { question: Question; categories: { id: string; name: string }[] }) {
  const categoryName = question.category
    ? (categories.find(c => c.id === question.category)?.name ?? null)
    : null;
  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await submitReply({ questionId: question.id, content: replyText, writerType: 'השואל' });
      setSent(true);
      setReplyText('');
      setReplyOpen(false);
      toast.success('תגובתך נשלחה בהצלחה!');
    } catch {
      toast.error('אירעה שגיאה, נא נסה שנית');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id={`q-${question.id}`}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      data-question-ref={question.referenceId}
      data-question-id={question.id}
    >
      <div className="h-1 bg-gradient-to-l from-secondary/60 via-secondary to-secondary/60" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {categoryName && (
              <span className="text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/25 px-2.5 py-1 rounded-full">
                {categoryName}
              </span>
            )}
            <span className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
              {sortedAnswers.length} {sortedAnswers.length === 1 ? 'תשובה' : 'תשובות'}
            </span>
          </div>
          {question.createdAt && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(question.createdAt)}
            </span>
          )}
        </div>

        <div className="flex gap-2 sm:gap-3 mb-5">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
            </div>
            {sortedAnswers.length > 0 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1.5">שאלה</p>
            <ExpandableText text={question.questionContent} className="text-primary/90" />
          </div>
        </div>

        {sortedAnswers.length > 0 ? (
          <div>
            {sortedAnswers.map((answer, i) => (
              <div key={answer.id} className={i === sortedAnswers.length - 1 ? '[&>div>div:first-child>div:last-child]:hidden' : ''}>
                <AnswerBlock answer={answer} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">התשובה בהכנה...</p>
        )}

        {!question.followUpBlocked && (
          <div className="mt-2 pt-3 border-t border-dashed">
            {sent ? (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                ✓ תגובתך נשלחה לרב
              </p>
            ) : (
              <>
                <button
                  onClick={() => setReplyOpen(prev => !prev)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary transition-colors min-h-[44px] w-full sm:w-auto"
                >
                  {replyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {replyOpen ? 'סגור' : 'שלח שאלת המשך לרב'}
                </button>
                {replyOpen && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="כתוב שאלת המשך..."
                      rows={4}
                      className="text-sm resize-none border border-input bg-white focus-visible:ring-1 w-full"
                    />
                    <Button
                      size="sm"
                      onClick={handleReply}
                      disabled={submitting || !replyText.trim()}
                      className="gap-2 bg-secondary text-primary hover:bg-secondary/90 min-h-[44px] w-full sm:w-auto"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submitting ? 'שולח...' : 'שלח'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
