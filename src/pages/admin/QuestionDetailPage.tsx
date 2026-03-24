import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, CheckCircle2, XCircle, BookOpen,
  MessageCircle, HelpCircle, Loader2, Send, Eye, EyeOff,
  Pencil, Trash2, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  getAllQuestions,
  approveQuestion,
  rejectQuestion,
  markAnswered,
  submitReply,
  updateQuestion,
  updateAnswer,
  deleteAnswer,
  deleteQuestion,
  type AdminQuestion,
} from '@/api/adminQuestionsApi';
import { getCategories } from '@/api/getCategories';
import { airtableUpdate } from '@/api/airtable';
import { cn } from '@/lib/utils';

function writerIcon(type: string) {
  if (type === 'רב') return <BookOpen className="h-4 w-4 text-secondary" />;
  if (type === 'שואל') return <HelpCircle className="h-4 w-4 text-primary" />;
  return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
}

function statusBadge(status?: string) {
  switch (status) {
    case 'נענה':  return <Badge className="bg-green-100 text-green-800 border-green-200">נענה</Badge>;
    case 'נדחה':  return <Badge className="bg-red-100 text-red-800 border-red-200">נדחה</Badge>;
    default:      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">ממתין</Badge>;
  }
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<AdminQuestion | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Editing question content
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [questionEditText, setQuestionEditText] = useState('');

  // Editing answers
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [answerEditText, setAnswerEditText] = useState('');

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  function reload() {
    setLoading(true);
    Promise.all([getAllQuestions(), getCategories()])
      .then(([{ questions }, { categories }]) => {
        setQuestion(questions.find(q => q.id === id) ?? null);
        setCategories(categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [id]);

  const categoryName = question?.category
    ? (categories.find(c => c.id === question.category)?.name ?? '')
    : '';

  async function handleReply() {
    if (!replyText.trim() || !id) return;
    setSubmitting(true);
    try {
      await submitReply({ questionId: id, content: replyText.trim() });
      if (question?.status === 'ממתין') await markAnswered(id);
      toast.success('התשובה נשלחה בהצלחה');
      setReplyText('');
      reload();
    } catch {
      toast.error('שגיאה בשליחת התשובה');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(action: string) {
    if (!id) return;
    setActionLoading(action);
    try {
      if (action === 'approve') {
        await approveQuestion(id);
        toast.success('השאלה אושרה לפרסום');
      } else if (action === 'reject') {
        await rejectQuestion(id);
        toast.success('השאלה נדחתה');
      } else if (action === 'toggleConsent') {
        await airtableUpdate('שאלות', id, {
          'הסכמה לפרסום': !question?.consentToPublish,
        });
        toast.success('עודכן');
      }
      reload();
    } catch {
      toast.error('שגיאה בעדכון');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveQuestion() {
    if (!id || !questionEditText.trim()) return;
    setActionLoading('editQuestion');
    try {
      await updateQuestion(id, { 'תוכן השאלה': questionEditText.trim() });
      toast.success('השאלה עודכנה');
      setEditingQuestion(false);
      reload();
    } catch {
      toast.error('שגיאה בעדכון השאלה');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveAnswer(answerId: string) {
    if (!answerEditText.trim()) return;
    setActionLoading('editAnswer-' + answerId);
    try {
      await updateAnswer(answerId, answerEditText.trim());
      toast.success('התשובה עודכנה');
      setEditingAnswerId(null);
      reload();
    } catch {
      toast.error('שגיאה בעדכון התשובה');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteAnswer(answerId: string) {
    setActionLoading('deleteAnswer-' + answerId);
    try {
      await deleteAnswer(answerId);
      toast.success('התשובה נמחקה');
      reload();
    } catch {
      toast.error('שגיאה במחיקת התשובה');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteQuestion() {
    if (!id) return;
    setActionLoading('deleteQuestion');
    try {
      await deleteQuestion(id);
      toast.success('השאלה נמחקה');
      navigate('/admin/questions');
    } catch {
      toast.error('שגיאה במחיקת השאלה');
    } finally {
      setActionLoading(null);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground mb-4">השאלה לא נמצאה</p>
        <Button asChild variant="outline">
          <Link to="/admin/questions">חזרה לרשימה</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full">

      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
          <Link to="/admin/questions">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Link>
        </Button>
        <div className="w-px h-5 bg-border" />
        <h1 className="text-lg font-bold text-primary flex-1 truncate">פרטי שאלה</h1>
        {statusBadge(question.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Main — question + thread + reply */}
        <div className="lg:col-span-2 space-y-4">

          {/* Question card */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <HelpCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-semibold text-primary">
                    {question.askerName ?? 'שואל אנונימי'}
                  </span>
                  {question.createdAt && (
                    <span className="text-xs text-muted-foreground mt-0.5">{question.createdAt}</span>
                  )}
                  <div className="mr-auto flex items-center gap-1 flex-shrink-0">
                    {editingQuestion ? (
                      <>
                        <button
                          onClick={handleSaveQuestion}
                          disabled={actionLoading === 'editQuestion'}
                          className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                          title="שמור"
                        >
                          {actionLoading === 'editQuestion'
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => setEditingQuestion(false)}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                          title="ביטול"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setEditingQuestion(true); setQuestionEditText(question.questionContent); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        title="ערוך שאלה"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {editingQuestion ? (
                  <Textarea
                    value={questionEditText}
                    onChange={e => setQuestionEditText(e.target.value)}
                    rows={4}
                    className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none text-sm"
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {question.questionContent}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Answers thread */}
          {question.answers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground px-1">תשובות ({question.answers.length})</p>
              {question.answers.map(answer => (
                <div key={answer.id} className={cn(
                  'bg-white rounded-xl border p-5',
                  answer.writerType === 'רב' ? 'border-secondary/40 border-r-4' : 'border-border'
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      answer.writerType === 'רב' ? 'bg-secondary/10' : 'bg-muted'
                    )}>
                      {writerIcon(answer.writerType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-semibold text-primary">{answer.writerType}</span>
                        {answer.date && (
                          <span className="text-xs text-muted-foreground mt-0.5">{answer.date}</span>
                        )}
                        <div className="mr-auto flex items-center gap-1 flex-shrink-0">
                          {editingAnswerId === answer.id ? (
                            <>
                              <button
                                onClick={() => handleSaveAnswer(answer.id)}
                                disabled={actionLoading === 'editAnswer-' + answer.id}
                                className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                                title="שמור"
                              >
                                {actionLoading === 'editAnswer-' + answer.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Check className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => setEditingAnswerId(null)}
                                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                                title="ביטול"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingAnswerId(answer.id); setAnswerEditText(answer.content); }}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                title="ערוך תשובה"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAnswer(answer.id)}
                                disabled={!!actionLoading}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="מחק תשובה"
                              >
                                {actionLoading === 'deleteAnswer-' + answer.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {editingAnswerId === answer.id ? (
                        <Textarea
                          value={answerEditText}
                          onChange={e => setAnswerEditText(e.target.value)}
                          rows={4}
                          className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary resize-none text-sm"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {answer.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply form */}
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-sm font-semibold text-primary mb-3">כתוב תשובה</p>
            <Textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="כתוב את תשובתך כאן..."
              rows={5}
              className="border border-input bg-white focus-visible:ring-1 focus-visible:border-secondary mb-3 resize-none"
            />
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || submitting}
              className="bg-secondary text-primary hover:bg-secondary/90 gap-2 min-h-[44px]"
            >
              {submitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
              {submitting ? 'שולח...' : 'שלח תשובה'}
            </Button>
          </div>

        </div>

        {/* Sidebar — info + actions */}
        <div className="space-y-4">

          {/* Info */}
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">פרטי שאלה</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">שואל</dt>
                <dd className="font-medium text-primary">{question.askerName ?? '—'}</dd>
              </div>
              {question.askerEmail && (
                <div>
                  <dt className="text-xs text-muted-foreground">אימייל</dt>
                  <dd className="font-medium text-primary break-all">{question.askerEmail}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">תאריך הגשה</dt>
                <dd className="font-medium text-primary">{question.createdAt ?? '—'}</dd>
              </div>
              {categoryName && (
                <div>
                  <dt className="text-xs text-muted-foreground">קטגוריה</dt>
                  <dd className="font-medium text-primary">{categoryName}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">סטטוס</dt>
                <dd className="mt-0.5">{statusBadge(question.status)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">הסכמה לפרסום</dt>
                <dd className="font-medium text-primary">
                  {question.consentToPublish ? 'כן' : 'לא'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">מאושר לפרסום</dt>
                <dd className="font-medium text-primary">
                  {question.approvedForPublish ? 'כן' : 'לא'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">פעולות</p>
            <div className="space-y-2">

              <Button
                variant="outline"
                className="w-full min-h-[44px] gap-2 justify-start border-green-200 text-green-700 hover:bg-green-50"
                disabled={question.approvedForPublish || !!actionLoading}
                onClick={() => handleAction('approve')}
              >
                {actionLoading === 'approve'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />
                }
                {question.approvedForPublish ? 'מאושר לפרסום' : 'אשר לפרסום'}
              </Button>

              <Button
                variant="outline"
                className="w-full min-h-[44px] gap-2 justify-start border-muted text-muted-foreground hover:bg-muted/40"
                disabled={!!actionLoading}
                onClick={() => handleAction('toggleConsent')}
              >
                {actionLoading === 'toggleConsent'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : question.consentToPublish ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
                }
                {question.consentToPublish ? 'בטל הסכמה לפרסום' : 'סמן הסכמה לפרסום'}
              </Button>

              <Button
                variant="outline"
                className="w-full min-h-[44px] gap-2 justify-start border-red-200 text-red-600 hover:bg-red-50"
                disabled={question.status === 'נדחה' || !!actionLoading}
                onClick={() => handleAction('reject')}
              >
                {actionLoading === 'reject'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <XCircle className="h-4 w-4" />
                }
                {question.status === 'נדחה' ? 'נדחה' : 'דחה שאלה'}
              </Button>

              <div className="pt-2 border-t border-border">
                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 text-center">האם אתה בטוח? לא ניתן לשחזר.</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px] border-red-200 text-red-600 hover:bg-red-50 gap-2"
                        disabled={actionLoading === 'deleteQuestion'}
                        onClick={handleDeleteQuestion}
                      >
                        {actionLoading === 'deleteQuestion'
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                        מחק
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 min-h-[44px]"
                        onClick={() => setConfirmDelete(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] gap-2 justify-start border-red-200 text-red-600 hover:bg-red-50"
                    disabled={!!actionLoading}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק שאלה
                  </Button>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
