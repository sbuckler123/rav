import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { getCategories } from '@/api/getCategories';
import QuestionForm from '@/components/ask/QuestionForm';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import { Info, Clock, AlertCircle } from 'lucide-react';

const guidelines = [
  {
    icon: Info,
    title: 'ניהול הפניות',
    body: 'מדור זה מופעל ומנוהל על ידי לשכת הרב הראשי. כל השאלות המגיעות למערכת מועברות לבחינה וטיפול של צוות הלשכה והרב באופן אישי.',
  },
  {
    icon: Clock,
    title: 'זמני מענה',
    body: 'עקב העומס הרב המונח על שולחנו של הרב, ייתכנו זמני מענה ארוכים מהרגיל. אנו עושים כל מאמץ להשיב לכל פונה בהקדם האפשרי.',
  },
  {
    icon: AlertCircle,
    title: 'שאלות דחופות',
    body: 'במקרים בהם השאלה דחופה, נא לציין זאת בפתח השאלה. פניות דחופות יקבלו עדיפות ויינתן עליהן מענה מהיר ככל הניתן.',
  },
];

export default function AskPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.categories)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEO
        title="שאל את הרב"
        description="שלחו שאלה הלכתית לרב קלמן מאיר בר ותקבלו מענה מלשכת הרב הראשי לישראל."
      />
      <Toaster />

      <PageHeader
        title="שאל את הרב"
        subtitle="שלחו את שאלותיכם ההלכתיות ותקבלו מענה מלשכת הרב הראשי"
      />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 sm:py-10">

        <section className="grid lg:grid-cols-5 gap-6 lg:gap-8" aria-label="שליחת שאלה">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <QuestionForm categories={categories} />
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2">
            <GuidelinesCard />
          </div>
        </section>
      </main>
    </div>
  );
}

function GuidelinesCard() {
  return (
    <div className="bg-[#F7F4EE] rounded-2xl p-5 sm:p-6 h-full">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-secondary rounded-full" />
        <h3 className="font-serif font-bold text-base sm:text-lg text-primary">הנחיות לשואלים</h3>
      </div>
      <div className="space-y-5">
        {guidelines.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center mt-0.5">
              <Icon className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-primary mb-1">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
