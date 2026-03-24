import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Youtube, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* עמודה ימנית - לוגו ותיאור */}
          <div>
            <h3 className="text-xl font-serif text-secondary mb-4">
              הרב קלמן מאיר בר שליט"א
            </h3>
            <p className="text-sm opacity-90 leading-relaxed">
              האתר הרשמי של נשיא מועצת הרבנות הראשית לישראל.<br />
            שאלות ותשובות, שיעורים, פסקי הלכה ואירועים.
            </p>
          </div>

          {/* עמודה מרכזית - קישורים מהירים */}
          <div>
            <h4 className="font-bold mb-4">קישורים מהירים</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ask" className="hover:text-secondary transition-colors">שאל את הרב</Link></li>
              <li><Link to="/videos" className="hover:text-secondary transition-colors">שיעורי וידאו</Link></li>
        
              <li><Link to="/shiurim" className="hover:text-secondary transition-colors">לוח שיעורים</Link></li>
              <li><Link to="/events" className="hover:text-secondary transition-colors">אירועים</Link></li>
            
              <li><Link to="/articles" className="hover:text-secondary transition-colors">ומאמרים ופסקי הלכה</Link></li>
              <li><Link to="/about" className="hover:text-secondary transition-colors">אודות</Link></li>
            </ul>
          </div>

          {/* עמודה שמאלית - יצירת קשר */}
          <div>
            <h4 className="font-bold mb-4">צור קשר</h4>
            <ul className="space-y-3 text-sm">
           <li className="flex items-start gap-2">
  <MapPin className="h-4 w-4 text-secondary mt-1" />
  <div className="flex flex-col">
    <span>אהליאב 5 ירושלים</span>
    <span>בנין הרבנות הראשית לישראל</span>
  </div>
</li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                <span>02-5313131</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                <span>Kh@rab.gov.il</span>
              </li>
            </ul>
            {/*<div className="flex gap-3 mt-4">
              <a href="#" className="hover:text-secondary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-secondary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>*/}
          </div>
        </div>

        {/* שורה תחתונה */}
        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1.5 text-sm opacity-75 flex-wrap text-center">
          <p>© {new Date().getFullYear()} כל הזכויות שמורות | הרב הראשי לישראל</p>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <Link to="/terms" className="hover:text-secondary transition-colors underline underline-offset-2">
            תנאי שימוש
          </Link>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <Link to="/privacy" className="hover:text-secondary transition-colors underline underline-offset-2">
            מדיניות פרטיות
          </Link>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <Link to="/cookies" className="hover:text-secondary transition-colors underline underline-offset-2">
            מדיניות עוגיות
          </Link>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <Link to="/accessibility" className="hover:text-secondary transition-colors underline underline-offset-2">
            הצהרת נגישות
          </Link>
        </div>
      </div>
    </footer>
  );
}
