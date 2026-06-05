import { useState, useEffect } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagedUser } from './types';
import { allPermissions } from './mockData';

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: ManagedUser | null;
  onSave: (userId: string, permissions: string[]) => void;
}

export default function RoleDialog({ isOpen, onClose, user, onSave }: RoleDialogProps) {
  const [perms, setPerms] = useState<string[]>(() => (user ? [...user.permissions] : []));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPerms(user ? [...user.permissions] : []);
  }, [user?.id, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !user) return null;

  const toggle = (id: string) => setPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900/95 border border-white/10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Manage Permissions</h2>
              <p className="text-xs text-muted-foreground">{user.name} · {user.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
          {allPermissions.map(p => (
            <div key={p.id} onClick={() => toggle(p.id)}
              className={cn('flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                perms.includes(p.id) ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]')}>
              <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                perms.includes(p.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600')}>
                {perms.includes(p.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-[11px] text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-white/[0.06]">
          <button onClick={() => { onSave(user.id, perms); onClose(); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-500/25">
            Save Permissions ({perms.length})
          </button>
        </div>
      </div>
    </div>
  );
}
