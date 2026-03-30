import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  MessageCircleQuestion,
  CalendarDays,
  Tv2,
  BookOpen,
  Video,
  Users,
  Tag,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'ראשי',             path: '/admin',           icon: LayoutDashboard },
  { label: 'שאלות ותשובות',   path: '/admin/questions', icon: MessageCircleQuestion },
  { label: 'שיעורים',         path: '/admin/shiurim',   icon: CalendarDays },
  { label: 'שיעורי וידאו',   path: '/admin/videos',    icon: Video },
  { label: 'אירועים',         path: '/admin/events',    icon: Tv2 },
  { label: 'מאמרים',          path: '/admin/articles',  icon: BookOpen },
  { label: 'קטגוריות',        path: '/admin/categories', icon: Tag },
  { label: 'משתמשים',         path: '/admin/users',     icon: Users },
];

const roleLabel: Record<string, string> = {
  'מנהל': 'מנהל',
  'רב':   'רב',
  'צוות': 'צוות',
};

function NavLink({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) {
  const location = useLocation();
  const isActive = item.path === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(item.path);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-secondary text-primary shadow-sm'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    toast.success('התנתקת בהצלחה');
    navigate('/admin/login');
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-primary">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-secondary rounded-full flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">ממשק ניהול</p>
          <p className="text-white/50 text-xs truncate">הרב קלמן מאיר בר</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-secondary text-xs font-bold">
              {user?.name?.charAt(0) ?? '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-white/50 text-xs">{roleLabel[user?.role ?? ''] ?? user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all min-h-[44px]"
        >
          <LogOut className="h-4 w-4" />
          התנתקות
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7F4EE]" dir="rtl">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 flex-shrink-0 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-60 sm:w-64 z-50 flex flex-col shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-border flex items-center gap-3 px-4 sm:px-6 h-14 shadow-sm">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0 h-11 w-11"
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Breadcrumb / page title — filled by children via context if needed */}
          <div className="flex-1" />

          {/* Back to site */}
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            חזרה לאתר
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}
