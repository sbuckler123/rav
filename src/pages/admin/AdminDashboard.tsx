import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { getAllQuestions } from '@/api/adminQuestionsApi';
import { getShiurim } from '@/api/getShiurim';
import { getArticles } from '@/api/getArticles';
import { getEvents } from '@/api/getEvents';
import {
  MessageCircleQuestion, CalendarDays, BookOpen, Tv2,
  Clock, ChevronLeft, ArrowLeft, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Stats {
  totalQuestions: number;
  pendingQuestions: number;
  answeredQuestions: number;
  rejectedQuestions: number;
  totalShiurim: number;
  upcomingShiurim: number;
  totalArticles: number;
  totalEvents: number;
}

interface RecentQuestion {
  id: string;
  content: string;
  askerName?: string;
  createdAt?: string;
  status?: string;
}

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
}

function statusBadge(status?: string) {
  switch (status) {
    case 'נענה': return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">נענה</Badge>;
    case 'נדחה': return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">נדחה</Badge>;
    default:     return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">ממתין</Badge>;
  }
}

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, to,
}: {
  label: string; value: number | string; sub?: string;
  icon: any; iconBg: string; iconColor: string; to: string;
}) {
  return (
    <Link to={to}>
      <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-primary">{value}</p>
        <p className="text-sm font-medium text-primary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Link>
  );
}

function MiniStatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-bold', color)}>{value}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllQuestions(),
      getShiurim(),
      getArticles(),
      getEvents(),
    ])
      .then(([{ questions }, { shiurim }, { articles }, { events }]) => {
        const now = new Date();
        const upcoming = shiurim.filter(s => s.date && parseDate(s.date) >= now);

        setStats({
          totalQuestions: questions.length,
          pendingQuestions: questions.filter(q => q.status === 'ממתין').length,
          answeredQuestions: questions.filter(q => q.status === 'נענה').length,
          rejectedQuestions: questions.filter(q => q.status === 'נדחה').length,
          totalShiurim: shiurim.length,
          upcomingShiurim: upcoming.length,
          totalArticles: articles.length,
          totalEvents: events.length,
        });

        setRecentQuestions(
          questions.slice(0, 5).map(q => ({
            id: q.id,
            content: q.questionContent,
            askerName: q.askerName,
            createdAt: q.createdAt,
            status: q.status,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{greeting}, {user?.name} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Main stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="שאלות"
            value={stats.totalQuestions}
            sub={`${stats.pendingQuestions} ממתינות לתשובה`}
            icon={MessageCircleQuestion}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            to="/admin/questions"
          />
          <StatCard
            label="שיעורים"
            value={stats.totalShiurim}
            sub={`${stats.upcomingShiurim} שיעורים קרובים`}
            icon={CalendarDays}
            iconBg="bg-secondary/10"
            iconColor="text-secondary"
            to="/admin/shiurim"
          />
          <StatCard
            label="מאמרים"
            value={stats.totalArticles}
            icon={BookOpen}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            to="/admin/articles"
          />
          <StatCard
            label="אירועים"
            value={stats.totalEvents}
            icon={Tv2}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            to="/admin/events"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent questions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <MessageCircleQuestion className="h-4 w-4 text-secondary" />
              שאלות אחרונות
            </h2>
            <Link to="/admin/questions">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                לכל השאלות
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-14 px-5 flex items-center">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : recentQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">אין שאלות עדיין</p>
          ) : (
            <div className="divide-y divide-border">
              {recentQuestions.map(q => (
                <Link
                  key={q.id}
                  to={`/admin/questions/${q.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    q.status === 'נענה' ? 'bg-green-500' :
                    q.status === 'נדחה' ? 'bg-red-500' : 'bg-amber-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary truncate group-hover:text-secondary transition-colors">
                      {q.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.askerName ?? 'אנונימי'}
                      {q.createdAt && <span className="mx-1">·</span>}
                      {q.createdAt}
                    </p>
                  </div>
                  <div className="flex-shrink-0">{statusBadge(q.status)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Questions breakdown */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary" />
              סטטוס שאלות
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
              </div>
            ) : stats && (
              <>
                <MiniStatRow label="ממתינות לתשובה" value={stats.pendingQuestions}  color="text-amber-600" />
                <MiniStatRow label="נענו"            value={stats.answeredQuestions} color="text-green-600" />
                <MiniStatRow label="נדחו"            value={stats.rejectedQuestions} color="text-red-500" />
              </>
            )}
            <Link to="/admin/questions?status=ממתין" className="mt-3 block">
              <Button size="sm" className="w-full bg-secondary text-primary hover:bg-secondary/90 gap-2 mt-2">
                <MessageCircleQuestion className="h-4 w-4" />
                ענה על שאלות ממתינות
              </Button>
            </Link>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-primary mb-3">פעולות מהירות</h2>
            <div className="space-y-2">
              {[
                { label: 'הוסף שיעור',   to: '/admin/shiurim',   icon: CalendarDays, color: 'text-secondary' },
                { label: 'הוסף אירוע',   to: '/admin/events',    icon: Tv2,          color: 'text-purple-600' },
                { label: 'הוסף מאמר',    to: '/admin/articles',  icon: BookOpen,     color: 'text-blue-600' },
              ].map(item => (
                <Link key={item.to} to={item.to}>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 min-h-[40px] mb-1">
                    <item.icon className={cn('h-4 w-4', item.color)} />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
