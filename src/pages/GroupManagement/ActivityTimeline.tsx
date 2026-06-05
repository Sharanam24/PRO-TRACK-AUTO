import { cn } from '@/lib/utils';
import { UserPlus, UserMinus, Mail, Crown, FolderPlus, Pencil } from 'lucide-react';
import type { ActivityItem } from './types';

const typeConfig = {
  join: { icon: UserPlus, color: 'text-emerald-400 bg-emerald-500/10' },
  leave: { icon: UserMinus, color: 'text-rose-400 bg-rose-500/10' },
  invite: { icon: Mail, color: 'text-blue-400 bg-blue-500/10' },
  role: { icon: Crown, color: 'text-yellow-400 bg-yellow-500/10' },
  create: { icon: FolderPlus, color: 'text-purple-400 bg-purple-500/10' },
  update: { icon: Pencil, color: 'text-cyan-400 bg-cyan-500/10' },
};

export default function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const cfg = typeConfig[item.type];
        const Icon = cfg.icon;
        return (
          <div key={item.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', cfg.color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {i < items.length - 1 && <div className="w-px flex-1 bg-white/[0.06] my-1" />}
            </div>
            <div className="pb-4 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{item.user}</span>{' '}
                <span className="text-muted-foreground">{item.action}</span>{' '}
                <span className="font-medium text-indigo-400">{item.target}</span>
              </p>
              <span className="text-[11px] text-muted-foreground">{item.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
