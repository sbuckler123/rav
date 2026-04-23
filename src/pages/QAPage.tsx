import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategories } from '@/api/getCategories';
import { getPublishedQuestions } from '@/api/getPublishedQuestions';
import PublishedQA from '@/components/ask/PublishedQA';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { PAGE_DESC } from '@/config/nav';

type GetPublishedQuestionsOutputType = Awaited<ReturnType<typeof getPublishedQuestions>>;

export default function QAPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [questions, setQuestions] = useState<GetPublishedQuestionsOutputType['questions']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then(r => setCategories(r.categories)).catch(() => {});
    getPublishedQuestions({})
      .then(r => setQuestions(r.questions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEO
        title='שו"ת'
        description='שאלות ותשובות בהלכה ובמחשבה מאת הרב קלמן מאיר בר, הרב הראשי לישראל — ארכיון שו"ת מלשכת הרב הראשי.'
      />

      <PageHeader
        title='שו"ת'
        subtitle={PAGE_DESC['/shut']}
      />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 sm:py-10">
        <section id="qa-section" aria-label="שאלות ותשובות מפורסמות">
          {loading ? (
            <div className="space-y-4" aria-busy="true" aria-label="טוען שאלות">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : (
            <PublishedQA questions={questions} categories={categories} />
          )}
        </section>
      </main>
    </div>
  );
}
