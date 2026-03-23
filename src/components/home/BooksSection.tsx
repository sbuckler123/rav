import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, ArrowLeft } from 'lucide-react';

const books = [
  { id: 1, title: 'משנת הרב - כרך א', description: 'פסקי הלכה בנושאי שבת ומועדים' },
  { id: 2, title: 'אורחות חיים', description: 'מדריך מקיף לחיי היהדות המעשיים' },
  { id: 3, title: 'דרכי התורה', description: 'חידושים וביאורים על מסכתות הש״ס' },
  { id: 4, title: 'הלכה למעשה', description: 'שאלות ותשובות מחיי היום יום' },
];

export default function BooksSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-serif font-bold text-center mb-10">ספרים ופרסומים</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="hover:shadow-lg transition-shadow">
            <div className="h-64 bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
              <BookOpen className="h-24 w-24 text-primary" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2">{book.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{book.description}</p>
              <Button size="sm" variant="outline" className="w-full gap-2">
                <Download className="h-4 w-4" />
                פרקים נבחרים (PDF)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button variant="outline" size="lg" className="gap-2">
          לכל הספרים
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}