import { cn } from '@/lib/utils';
import { Calendar as CalIcon, Clock } from 'lucide-react';
import type { ScheduleEvent } from './types';

const typeColors: Record<string, string> = {
  'Review I': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Review II': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Review III': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Final Viva': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const statusColors: Record<string, string> = {
  'draft': 'text-zinc-400 bg-white/5 border-white/10',
  'published': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'completed': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

interface ScheduleCardProps {
  schedule: ScheduleEvent;
  onClick: () => void;
}

export default function ScheduleCard({ schedule, onClick }: ScheduleCardProps) {
  const scheduledCount = schedule.slots.filter(s => s.status === 'scheduled').length;
  
  return (
    <div 
      onClick={onClick}
      className="group relative rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer hover:-translate-y-1 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mb-2', typeColors[schedule.type])}>
            {schedule.type}
          </span>
          <h3 className="font-bold text-lg leading-tight">{schedule.title}</h3>
        </div>
        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', statusColors[schedule.status])}>
          {schedule.status}
        </span>
      </div>

      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalIcon className="w-4 h-4 text-zinc-400" />
          <span>{new Date(schedule.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(schedule.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span>{scheduledCount} slots scheduled</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-zinc-400 font-medium">
              F{i}
            </div>
          ))}
          <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-zinc-400 font-medium">
            +4
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-semibold">
          Manage Slots
        </button>
      </div>
    </div>
  );
}
