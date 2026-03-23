import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const books = [
  { 
    id: 1, 
    title: 'משנת הרב - כרך א', 
    subtitle: 'פסקי הלכה בשבת ומועדים',
    description: 'ספר מקיף הכולל פסקי הלכה מעמיקים בנושאי שבת ומועדים, עם ביאורים ומקורות.',
    pages: 450,
    year: 2022,
    category: 'הלכה'
  },
  { 
    id: 2, 
    title: 'משנת הרב - כרך ב', 
    subtitle: 'הלכות כשרות וברכות',
    description: 'עיון מקיף בהלכות כשרות וברכות, עם פסקים למעשה ובירורים הלכתיים.',
    pages: 520,
    year: 2023,
    category: 'הלכה'
  },
  { 
    id: 3, 
    title: 'אורחות חיים', 
    subtitle: 'מדריך לחיי היהדות המעשיים',
    description: 'מדריך מקיף לחיי היהדות המעשיים, מהשכמה בבוקר ועד השכיבה בלילה.',
    pages: 380,
    year: 2021,
    category: 'מדריכים'
  },
  { 
    id: 4, 
    title: 'דרכי התורה', 
    subtitle: 'חידושים על מסכתות הש"ס',
    description: 'חידושים וביאורים על מסכתות הש"ס, עם עיון בראשונים ואחרונים.',
    pages: 650,
    year: 2020,
    category: 'לימוד גמרא'
  },
  { 
    id: 5, 
    title: 'הלכה למעשה', 
    subtitle: 'שאלות ותשובות מחיי היום יום',
    description: 'אוסף שאלות ותשובות הלכתיות מחיי היום יום, עם פסקים מעשיים.',
    pages: 420,
    year: 2023,
    category: 'שו"ת'
  },
  { 
    id: 6, 
    title: 'הלכות תפילה', 
    subtitle: 'דינים ומנהגים',
    description: 'ספר מקיף בהלכות תפילה, מתפילת שחרית ועד תפילת ערבית.',
    pages: 390,
    year: 2022,
    category: 'הלכה'
  },
  { 
    id: 7, 
    title: 'יהדות ומדע', 
    subtitle: 'דיאלוג וחיבור',
    description: 'עיון ביחסים בין תורה למדע, והאתגרים המודרניים של היהדות.',
    pages: 320,
    year: 2021,
    category: 'מחשבה'
  },
  { 
    id: 8, 
    title: 'הלכות טהרת המשפחה', 
    subtitle: 'דינים וביאורים',
    description: 'ספר מקיף בהלכות טהרת המשפחה, עם ביאורים ופסקים.',
    pages: 480,
    year: 2023,
    category: 'הלכה'
  },
];

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
      <h1 className="text-4xl font-serif font-bold text-center mb-4">ספרים ופרסומים</h1>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        אוסף מקיף של ספרי הרב בתחומי הלכה, מחשבה ולימוד גמרא
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-80 bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center p-6">
              <div className="text-center">
                <BookOpen className="h-24 w-24 text-primary mx-auto mb-4" />
                <h3 className="font-serif font-bold text-xl mb-2">{book.title}</h3>
                <p className="text-sm text-muted-foreground">{book.subtitle}</p>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">{book.category}</Badge>
                <span className="text-xs text-muted-foreground">{book.year}</span>
                <span className="text-xs text-muted-foreground">• {book.pages} עמ'</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{book.description}</p>
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  פרקים נבחרים (PDF)
                </Button>
                <Button size="sm" className="w-full gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  רכישת הספר
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}