import { cn } from '@/lib/utils';
import { Users, ArrowRight, Hash } from 'lucide-react';
import AvatarStack from './AvatarStack';
import type { ProjectGroup } from './types';

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  forming: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  archived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
};

interface GroupCardProps {
  group: ProjectGroup;
  onSelect: (g: ProjectGroup) => void;
}

export default function GroupCard({ group, onSelect }: GroupCardProps) {
  return (
    <div
      onClick={() => onSelect(group)}
      className={cn(
        'group relative rounded-2xl p-5 cursor-pointer transition-all duration-300',
        'bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12]',
        'hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5'
      )}
    >
      {/* Glassmorphism shine */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-base group-hover:text-indigo-400 transition-colors">{group.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{group.topic}</p>
          </div>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', statusColors[group.status])}>
            {group.status}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{group.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {group.tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Hash className="w-2.5 h-2.5" />{t}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarStack members={group.members} max={3} size="sm" />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.members.length}/{group.maxMembers}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            View <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
