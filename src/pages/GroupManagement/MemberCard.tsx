import { cn } from '@/lib/utils';
import { Crown, Shield, Eye, MoreVertical, UserMinus, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import type { TeamMember } from './types';

const roleConfig = {
  leader: { label: 'Leader', icon: Crown, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  member: { label: 'Member', icon: Shield, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' },
};

const statusDot = {
  active: 'bg-emerald-500',
  invited: 'bg-amber-500 animate-pulse',
  pending: 'bg-zinc-500',
};

interface MemberCardProps {
  member: TeamMember;
  isLeader: boolean;
  onPromote?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export default function MemberCard({ member, isLeader, onPromote, onRemove }: MemberCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rc = roleConfig[member.role];
  const Icon = rc.icon;

  return (
    <div className="group relative flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300">
      <div className="relative">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`}
          alt={member.name}
          className="w-10 h-10 rounded-full bg-zinc-800"
        />
        <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900', statusDot[member.status])} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{member.name}</span>
          <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', rc.color)}>
            <Icon className="w-2.5 h-2.5" />
            {rc.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>

      {isLeader && member.role !== 'leader' && (
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => { onPromote?.(member.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-amber-400"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Promote to Leader
                </button>
                <button
                  onClick={() => { onRemove?.(member.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-rose-400"
                >
                  <UserMinus className="w-3.5 h-3.5" /> Remove Member
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
