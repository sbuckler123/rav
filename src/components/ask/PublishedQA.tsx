import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ChevronDown, ChevronUp, Send, BookOpen, HelpCircle, CalendarDays } from 'lucide-react';
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

function formatDate(raw: any): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > CHAR_LIMIT;

  return (
    <div>
      <p className={`text-sm leading-relaxed ${className ?? ''}`}>
        {isLong && !expanded ? text.slice(0, CHAR_LIMIT) + '...' : text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="mt-2 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1 focus:outline-none"
        >
          {expanded
            ? <><ChevronUp className="h-3 w-3" />הצג פחות</>
            : <><ChevronDown className="h-3 w-3" />קרא עוד</>}
        </button>
      )}
    </div>
  );
}

function AnswerBlock({ answer, index }: { answer: Answer; index: number }) {
  const isRabbi = answer.writerType === 'רב';

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Icon column */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isRabbi ? 'bg-primary' : 'bg-muted'}`}>
          {isRabbi
            ? <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" />
            : <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
          }
        </div>
        {/* Connector line — hidden on last item via parent */}
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
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
        <div className={`rounded-xl p-3 sm:p-3.5 text-sm leading-relaxed ${isRabbi ? 'bg-[#F7F4EE] border border-secondary/15' : 'bg-muted/30 border border-border'}`}>
          <ExpandableText text={answer.content} />
        </div>
      </div>
    </div>
  );
}

export default function PublishedQA({ questions, categories }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Only show categories that actually appear in questions
  const activeCategories = categories.filter(c =>
    questions.some(q => q.category === c.id)
  );

  const sorted = [...questions].sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filtered = selectedCategory === 'all'
    ? sorted
    : sorted.filter(q => q.category === selectedCategory);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(PAGE_SIZE);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-25" />
        <p className="text-sm">אין שאלות מפורסמות כרגע.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category filter pills */}
      {activeCategories.length > 0 && (
        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all min-h-[36px] ${
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
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all min-h-[36px] ${
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
      {visible.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-25" />
          <p className="text-sm">אין שאלות בקטגוריה זו.</p>
        </div>
      ) : (
        visible.map(q => (
          <QuestionCard key={q.id} question={q} categories={categories} />
        ))
      )}

      {hasMore && (
        <button
          onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full py-3 rounded-xl border border-dashed border-secondary/40 text-sm text-secondary hover:bg-secondary/5 transition-colors min-h-[48px] font-medium"
        >
          טען עוד שאלות ({filtered.length - visibleCount} נותרו)
        </button>
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
      await submitReply({ questionId: question.id, content: replyText });
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
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-l from-secondary/60 via-secondary to-secondary/60" />

      <div className="p-5 sm:p-6">
        {/* Header row: category + answer count + date */}
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

        {/* Question block */}
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

        {/* Answers thread */}
        {sortedAnswers.length > 0 ? (
          <div>
            {sortedAnswers.map((answer, i) => (
              <div key={answer.id} className={i === sortedAnswers.length - 1 ? '[&>div>div:first-child>div:last-child]:hidden' : ''}>
                <AnswerBlock answer={answer} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic mr-9 sm:mr-11">התשובה בהכנה...</p>
        )}

        {/* Reply */}
        <div className="mt-2 pt-3 border-t border-dashed">
          {sent ? (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
              ✓ תגובתך נשלחה לרב
            </p>
          ) : (
            <>
              <button
                onClick={() => setReplyOpen(prev => !prev)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary transition-colors min-h-[36px]"
              >
                {replyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {replyOpen ? 'סגור' : 'שלח שאלת המשך לרב'}
              </button>
              {replyOpen && (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="כתוב שאלת המשך..."
                    rows={3}
                    className="text-sm resize-none border border-input bg-white focus-visible:ring-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="gap-2 bg-secondary text-primary hover:bg-secondary/90 min-h-[40px]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submitting ? 'שולח...' : 'שלח'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
