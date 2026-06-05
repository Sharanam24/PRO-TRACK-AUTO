import { useState } from 'react';
import { X, Send, Search, UserPlus } from 'lucide-react';

const allStudents = [
  { id: 's1', name: 'Amit Shah', email: 'amit@uni.edu', avatar: 'Amit' },
  { id: 's2', name: 'Neha Gupta', email: 'neha@uni.edu', avatar: 'Neha' },
  { id: 's3', name: 'Rohan Mehta', email: 'rohan@uni.edu', avatar: 'Rohan' },
  { id: 's4', name: 'Kavya Iyer', email: 'kavya@uni.edu', avatar: 'Kavya' },
  { id: 's5', name: 'Siddharth Das', email: 'sid@uni.edu', avatar: 'Sid' },
  { id: 's6', name: 'Tanvi Rao', email: 'tanvi@uni.edu', avatar: 'Tanvi' },
];

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  onInvite: (studentIds: string[], message: string) => void;
}

export default function InviteModal({ isOpen, onClose, groupName, onInvite }: InviteModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const filtered = allStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900/95 border border-white/10 shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Invite Members</h2>
              <p className="text-xs text-muted-foreground">to {groupName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600" />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filtered.map(s => (
              <div key={s.id} onClick={() => toggle(s.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                  selected.includes(s.id) ? 'bg-indigo-500/15 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'
                }`}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.avatar}`} alt={s.name} className="w-8 h-8 rounded-full bg-zinc-800" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.email}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selected.includes(s.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'
                }`}>
                  {selected.includes(s.id) && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Add a personal note..."
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none placeholder:text-zinc-600" />
          </div>

          <button onClick={() => { onInvite(selected, message); setSelected([]); setMessage(''); onClose(); }}
            disabled={selected.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25">
            <Send className="w-4 h-4" /> Send {selected.length > 0 ? `${selected.length} Invite${selected.length > 1 ? 's' : ''}` : 'Invites'}
          </button>
        </div>
      </div>
    </div>
  );
}
