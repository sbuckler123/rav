import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">

          {/* לוגו ותיאור — full width on mobile */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl font-serif text-secondary mb-3">
              הרב קלמן מאיר בר שליט"א
            </h3>
            <p className="text-sm opacity-80 leading-relaxed">
              האתר הרשמי של נשיא מועצת הרבנות הראשית לישראל.{' '}
              שאלות ותשובות, שיעורים, פסקי הלכה ואירועים.
            </p>
          </div>

          {/* קישורים מהירים */}
          <div>
            <h4 className="font-bold mb-3 text-sm sm:text-base">קישורים מהירים</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shaal-et-harav" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">שאל את הרב</Link></li>
              <li><Link to="/shut" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">שו"ת</Link></li>
              <li><Link to="/shiurei-torah" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">שיעורי תורה</Link></li>
              <li><Link to="/luach-iruyim" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">לוח אירועים</Link></li>
              <li><Link to="/yoman-peilut" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">יומן פעילות</Link></li>
              <li><Link to="/hagut-upsika" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">הגות ופסיקה</Link></li>
              <li><Link to="/odot" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">אודות</Link></li>
            </ul>
          </div>

          {/* צור קשר */}
          <div>
            <h4 className="font-bold mb-3 text-sm sm:text-base">צור קשר</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                <div className="opacity-80 leading-snug">
                  <span>אהליאב 5 ירושלים</span><br />
                  <span>בנין הרבנות הראשית לישראל</span>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary flex-shrink-0" />
                <span className="opacity-80" dir="ltr">02-5313131</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary flex-shrink-0" />
                <span className="opacity-80 break-all" dir="ltr">Kh@rab.gov.il</span>
              </li>
            </ul>
          </div>

          {/* מידע משפטי */}
          <div>
            <h4 className="font-bold mb-3 text-sm sm:text-base">מידע משפטי</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">תנאי שימוש</Link></li>
              <li><Link to="/privacy" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">מדיניות פרטיות</Link></li>
              <li><Link to="/cookies" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">מדיניות עוגיות</Link></li>
              <li><Link to="/accessibility" className="opacity-80 hover:opacity-100 hover:text-secondary transition-colors block py-0.5">הצהרת נגישות</Link></li>
            </ul>
          </div>

        </div>

        {/* שורה תחתונה */}
        <div className="border-t border-white/20 mt-8 pt-5 text-center text-xs sm:text-sm opacity-70">
          <p>© {new Date().getFullYear()} כל הזכויות שמורות | הרב הראשי לישראל</p>
        </div>
      </div>
    </footer>
  );
}
