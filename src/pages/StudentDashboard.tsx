import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Award,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'md' | 'lg';
type Trend = 'up' | 'down' | 'flat';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number | string;
  trend?: Trend;
  caption?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  size?: Size;
  compact?: boolean;
  className?: string;
}

const toneMap: Record<Tone, { card: string; value: string; deltaUp: string; deltaDown: string }> = {
  default: {
    card: 'bg-zinc-100/70 dark:bg-zinc-900/50 ring-1 ring-zinc-200 dark:ring-zinc-800',
    value: 'text-zinc-950 dark:text-zinc-50',
    deltaUp: 'text-emerald-600 dark:text-emerald-400',
    deltaDown: 'text-rose-600 dark:text-rose-400',
  },
  primary: {
    card: 'bg-blue-100/70 dark:bg-blue-900/30 ring-1 ring-blue-200/60 dark:ring-blue-800/60',
    value: 'text-blue-700 dark:text-blue-200',
    deltaUp: 'text-emerald-600 dark:text-emerald-400',
    deltaDown: 'text-rose-600 dark:text-rose-400',
  },
  success: {
    card: 'bg-emerald-100/70 dark:bg-emerald-900/30 ring-1 ring-emerald-200/60 dark:ring-emerald-800/60',
    value: 'text-emerald-700 dark:text-emerald-200',
    deltaUp: 'text-emerald-700 dark:text-emerald-300',
    deltaDown: 'text-rose-600 dark:text-rose-400',
  },
  warning: {
    card: 'bg-amber-100/70 dark:bg-amber-900/30 ring-1 ring-amber-200/60 dark:ring-amber-800/60',
    value: 'text-amber-700 dark:text-amber-200',
    deltaUp: 'text-emerald-600 dark:text-emerald-400',
    deltaDown: 'text-rose-600 dark:text-rose-400',
  },
  danger: {
    card: 'bg-rose-100/70 dark:bg-rose-900/30 ring-1 ring-rose-200/60 dark:ring-rose-800/60',
    value: 'text-rose-700 dark:text-rose-200',
    deltaUp: 'text-emerald-600 dark:text-emerald-400',
    deltaDown: 'text-rose-700 dark:text-rose-300',
  },
};

const sizeMap: Record<Size, { pad: string; label: string; value: string; caption: string; icon: string }> = {
  sm: { pad: 'p-3', label: 'text-xs', value: 'text-xl', caption: 'text-[11px]', icon: 'h-4 w-4' },
  md: { pad: 'p-4', label: 'text-sm', value: 'text-2xl', caption: 'text-xs', icon: 'h-5 w-5' },
  lg: { pad: 'p-6', label: 'text-sm', value: 'text-3xl', caption: 'text-sm', icon: 'h-6 w-6' },
};

function KpiCard({ label, value, delta, trend = 'flat', caption, icon, tone = 'primary', size = 'md', compact = false, className }: KpiCardProps) {
  const t = toneMap[tone];
  const s = sizeMap[size];

  const deltaValue = typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}%` : delta;
  const isUp = trend === 'up';
  const isDown = trend === 'down';
  const DeltaIcon = isUp ? TrendingUp : isDown ? TrendingDown : TrendingUp;

  return (
    <div className={cn('relative overflow-hidden rounded-xl shadow-sm', t.card, s.pad, !compact && 'min-h-[92px]', className)}>
      <span className='pointer-events-none absolute -right-6 -top-6 inline-flex h-16 w-16 rounded-full bg-black/5 dark:bg-white/5' />
      <span className='pointer-events-none absolute -right-2 -top-2 inline-flex h-8 w-8 rounded-full bg-black/5 dark:bg-white/5' />

      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <div className={cn('font-medium text-zinc-700 dark:text-zinc-300', s.label)}>{label}</div>
          <div className={cn('font-semibold tracking-tight', t.value, s.value)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {caption && <div className={cn('text-zinc-500 dark:text-zinc-400', s.caption)}>{caption}</div>}
        </div>

        <div className='flex items-center gap-2'>
          {typeof deltaValue !== 'undefined' && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', isUp ? t.deltaUp : isDown ? t.deltaDown : 'text-zinc-500 dark:text-zinc-400')}>
              <DeltaIcon className='h-4 w-4' aria-hidden />
              {deltaValue}
            </div>
          )}
          {icon && <div className={cn('rounded-full bg-white/40 p-1 dark:bg-white/10', s.icon)}>{icon}</div>}
        </div>
      </div>

      <div className='bg-current/40 mt-3 h-0.5 w-16 rounded opacity-60' />
    </div>
  );
}

interface TimelineItem {
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'pending' | 'upcoming';
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center',
              item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600' :
              item.status === 'pending' ? 'bg-amber-500/20 text-amber-600' :
              'bg-zinc-500/20 text-zinc-600'
            )}>
              {item.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
               item.status === 'pending' ? <AlertCircle className="h-4 w-4" /> :
               <Clock className="h-4 w-4" />}
            </div>
            {index < items.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm">{item.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentDashboard() {
  const kpiData = [
    { label: 'Overall Progress', value: '68%', delta: 5, trend: 'up' as Trend, tone: 'success' as Tone, icon: <Award className="h-4 w-4" /> },
    { label: 'Active Milestones', value: 3, delta: 1, trend: 'up' as Trend, tone: 'primary' as Tone, icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Logbook Entries', value: 8, delta: -1, trend: 'down' as Trend, tone: 'warning' as Tone, icon: <Calendar className="h-4 w-4" /> },
    { label: 'Time Spent', value: '42h', delta: 12, trend: 'up' as Trend, tone: 'default' as Tone, icon: <Clock className="h-4 w-4" /> },
  ];

  const courseProgress = [
    { label: 'Literature Review', value: 100 },
    { label: 'System Design', value: 85 },
    { label: 'Implementation', value: 45 },
    { label: 'Testing', value: 10 },
  ];

  const timelineItems: TimelineItem[] = [
    { title: 'Logbook Week 8 Due', description: 'Submit progress report to Faculty Guide', time: '2 hours', status: 'pending' },
    { title: 'System Architecture Approved', description: 'Dr. Jenkins approved the high-level design', time: '1 day ago', status: 'completed' },
    { title: 'Mid-Term Review', description: 'Present milestone 2 to the committee', time: '3 days', status: 'upcoming' },
    { title: 'Literature Review Complete', description: 'Final document submitted and verified', time: '2 weeks ago', status: 'completed' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Welcome back!</h2>
        <p className="text-muted-foreground">Here's your project status for this week.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KpiCard
            key={index}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            trend={kpi.trend}
            tone={kpi.tone}
            icon={kpi.icon}
            caption="vs last week"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Milestone Progress</h3>
            <p className="text-sm text-muted-foreground">Your performance across project phases</p>
          </div>
          <div className="space-y-6">
            {courseProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-bold">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Upcoming & Recent</h3>
            <p className="text-sm text-muted-foreground">Your academic timeline</p>
          </div>
          <Timeline items={timelineItems} />
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
