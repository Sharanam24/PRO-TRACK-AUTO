import { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import type { ManagedUser, UserRole, UserStatus, Department, AcademicYear } from './types';
import { departments, academicYears, roles, statuses } from './mockData';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (u: Partial<ManagedUser>) => void;
  user?: ManagedUser | null;
}

export default function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const defaultForm = { name: '', email: '', phone: '', role: 'student' as UserRole, department: 'Computer Science' as Department, academicYear: '2025-26' as AcademicYear, status: 'active' as UserStatus, enrollmentId: '' };
  const [form, setForm] = useState(() => user ? { name: user.name, email: user.email, phone: user.phone, role: user.role, department: user.department, academicYear: user.academicYear, status: user.status, enrollmentId: user.enrollmentId } : defaultForm);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(user ? { name: user.name, email: user.email, phone: user.phone, role: user.role, department: user.department, academicYear: user.academicYear, status: user.status, enrollmentId: user.enrollmentId } : defaultForm);
  }, [user?.id, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const isEdit = !!user;
  const inputClass = "w-full mt-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-600";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900/95 border border-white/10 shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-zinc-900/95 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{isEdit ? 'Edit User' : 'Add New User'}</h2>
              <p className="text-xs text-muted-foreground">{isEdit ? 'Update user information' : 'Create a new user account'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, id: user?.id || String(Date.now()), avatar: form.name.split(' ')[0], joinedAt: user?.joinedAt || new Date().toISOString().split('T')[0], lastActive: 'Just now', permissions: user?.permissions || ['view_dashboard'] }); onClose(); }} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className={inputClass} required /></div>
            <div><label className={labelClass}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@uni.edu" className={inputClass} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className={inputClass} /></div>
            <div><label className={labelClass}>Enrollment ID</label><input value={form.enrollmentId} onChange={e => setForm({ ...form, enrollmentId: e.target.value })} placeholder="CS2025001" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Role</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} className={inputClass}>{roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}</select></div>
            <div><label className={labelClass}>Department</label><select value={form.department} onChange={e => setForm({ ...form, department: e.target.value as Department })} className={inputClass}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Academic Year</label><select value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value as AcademicYear })} className={inputClass}>{academicYears.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            <div><label className={labelClass}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as UserStatus })} className={inputClass}>{statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25">
            <Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}
