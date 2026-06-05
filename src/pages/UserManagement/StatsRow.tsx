import { cn } from '@/lib/utils';
import { Users, UserCheck, GraduationCap, BookOpen, ShieldCheck, Building2 } from 'lucide-react';
import type { UserStats } from './types';

const stats = [
  { key: 'totalUsers' as const, label: 'Total Users', icon: Users, gradient: 'from-indigo-500 to-blue-500' },
  { key: 'activeUsers' as const, label: 'Active Users', icon: UserCheck, gradient: 'from-emerald-500 to-teal-500' },
  { key: 'students' as const, label: 'Students', icon: GraduationCap, gradient: 'from-violet-500 to-purple-500' },
  { key: 'faculty' as const, label: 'Faculty', icon: BookOpen, gradient: 'from-amber-500 to-orange-500' },
  { key: 'committees' as const, label: 'Committee', icon: ShieldCheck, gradient: 'from-rose-500 to-pink-500' },
  { key: 'departments' as const, label: 'Departments', icon: Building2, gradient: 'from-cyan-500 to-blue-500' },
];

export default function StatsRow({ data }: { data: UserStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.key} className="relative rounded-xl p-4 bg-white/[0.03] border border-white/[0.06] overflow-hidden group hover:border-white/[0.12] transition-all hover:-translate-y-0.5 duration-300">
            <div className={cn('absolute top-0 right-0 w-16 h-16 rounded-full bg-gradient-to-br opacity-10 -mr-4 -mt-4 group-hover:opacity-20 transition-opacity', s.gradient)} />
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', s.gradient)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{data[s.key]}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}
