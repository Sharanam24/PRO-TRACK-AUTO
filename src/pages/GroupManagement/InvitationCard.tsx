import { cn } from '@/lib/utils';
import { Check, X, MessageSquare } from 'lucide-react';
import type { Invitation } from './types';

interface InvitationCardProps {
  invitation: Invitation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export default function InvitationCard({ invitation, onAccept, onReject }: InvitationCardProps) {
  const isPending = invitation.status === 'pending';

  return (
    <div className={cn(
      'relative rounded-xl p-4 transition-all duration-300 border',
      isPending
        ? 'bg-indigo-500/[0.04] border-indigo-500/20 hover:border-indigo-500/30'
        : 'bg-white/[0.02] border-white/[0.06] opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${invitation.invitedByAvatar}`}
          alt={invitation.invitedBy}
          className="w-10 h-10 rounded-full bg-zinc-800 ring-2 ring-indigo-500/20"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{invitation.invitedBy}</span>
            <span className="text-xs text-muted-foreground">invited you to</span>
            <span className="font-semibold text-sm text-indigo-400">{invitation.groupName}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{invitation.sentAt}</p>
          {invitation.message && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground bg-white/5 rounded-lg p-2">
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="italic">"{invitation.message}"</span>
            </div>
          )}
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 mt-3 ml-[52px]">
          <button
            onClick={() => onAccept(invitation.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all border border-emerald-500/20"
          >
            <Check className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => onReject(invitation.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all border border-rose-500/20"
          >
            <X className="w-3 h-3" /> Decline
          </button>
        </div>
      )}

      {!isPending && (
        <div className="mt-2 ml-[52px]">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
            invitation.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          )}>
            {invitation.status}
          </span>
        </div>
      )}
    </div>
  );
}
