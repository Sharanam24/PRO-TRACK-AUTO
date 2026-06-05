import { useState } from 'react';
import { X, Calendar as CalIcon, Save } from 'lucide-react';
import type { ReviewType } from './types';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function CreateScheduleModal({ isOpen, onClose, onSave }: CreateScheduleModalProps) {
  const [form, setForm] = useState({
    title: '',
    type: 'Review I' as ReviewType,
    startDate: '',
    endDate: '',
  });

  if (!isOpen) return null;

  const inputClass = "w-full mt-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-600";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900/95 border border-white/10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <CalIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">New Schedule</h2>
              <p className="text-xs text-muted-foreground">Create a new review timeline</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form); onClose(); }} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Schedule Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-Term Review 2025" className={inputClass} required />
          </div>
          
          <div>
            <label className={labelClass}>Review Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ReviewType })} className={inputClass}>
              <option value="Review I">Review I (Ideation)</option>
              <option value="Review II">Review II (Design)</option>
              <option value="Review III">Review III (Implementation)</option>
              <option value="Final Viva">Final Viva Voce</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputClass} required />
            </div>
          </div>

          <button type="submit" className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25">
            <Save className="w-4 h-4" /> Create Schedule
          </button>
        </form>
      </div>
    </div>
  );
}
