import { cn } from '@/lib/utils';
import type { TeamMember } from './types';

interface AvatarStackProps {
  members: TeamMember[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
};

const gradients = [
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

export default function AvatarStack({ members, max = 4, size = 'md' }: AvatarStackProps) {
  const shown = members.slice(0, max);
  const remaining = members.length - max;
  const sz = sizeClasses[size];

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, i) => (
        <div
          key={m.id}
          className={cn(
            'rounded-full ring-2 ring-background relative transition-transform hover:scale-110 hover:z-10',
            sz
          )}
          style={{ zIndex: shown.length - i }}
          title={m.name}
        >
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.avatar}`}
            alt={m.name}
            className={cn('rounded-full bg-gradient-to-br', gradients[i % gradients.length], sz)}
          />
          {m.status === 'invited' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full ring-2 ring-background" />
          )}
          {m.role === 'leader' && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full ring-2 ring-background flex items-center justify-center text-[6px]">★</span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn('rounded-full ring-2 ring-background bg-zinc-700 flex items-center justify-center font-semibold text-zinc-300', sz)}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
