import { cn } from '@/lib/utils';
import { MoreVertical, Edit2, Shield, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ManagedUser } from './types';

const roleColors: Record<string, string> = {
  student: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  faculty: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  coordinator: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  committee: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  inactive: 'bg-zinc-500/20 text-zinc-400',
  suspended: 'bg-rose-500/20 text-rose-400',
};

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-zinc-500',
  suspended: 'bg-rose-500',
};

interface UserTableProps {
  users: ManagedUser[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (u: ManagedUser) => void;
  onRoles: (u: ManagedUser) => void;
  onDelete: (id: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export default function UserTable({ users, selectedIds, onToggleSelect, onToggleAll, onEdit, onRoles, onDelete, page, pageSize, onPageChange }: UserTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const totalPages = Math.ceil(users.length / pageSize);
  const paged = users.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paged.length > 0 && paged.every(u => selectedIds.includes(u.id));

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.02]">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.03]">
              <th className="p-3 w-10">
                <div onClick={onToggleAll} className={cn('w-4.5 h-4.5 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
                  allSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600 hover:border-zinc-400')}>
                  {allSelected && <span className="text-white text-[10px]">✓</span>}
                </div>
              </th>
              <th className="p-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider">User</th>
              <th className="p-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Role</th>
              <th className="p-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Department</th>
              <th className="p-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Enrollment</th>
              <th className="p-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="p-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Last Active</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <tr key={u.id} className={cn('border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]',
                selectedIds.includes(u.id) && 'bg-indigo-500/[0.06]')}>
                <td className="p-3">
                  <div onClick={() => onToggleSelect(u.id)} className={cn('w-4.5 h-4.5 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
                    selectedIds.includes(u.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600 hover:border-zinc-400')}>
                    {selectedIds.includes(u.id) && <span className="text-white text-[10px]">✓</span>}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.avatar}`} alt={u.name} className="w-9 h-9 rounded-full bg-zinc-800" />
                      <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900', statusDot[u.status])} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', roleColors[u.role])}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">{u.department}</td>
                <td className="p-3 hidden xl:table-cell font-mono text-xs text-muted-foreground">{u.enrollmentId}</td>
                <td className="p-3 hidden lg:table-cell">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', statusColors[u.status])}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground">{u.lastActive}</td>
                <td className="p-3 relative">
                  <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === u.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-4 top-10 z-50 w-44 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => { onEdit(u); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-blue-400">
                          <Edit2 className="w-3.5 h-3.5" /> Edit User
                        </button>
                        <button onClick={() => { onRoles(u); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-amber-400">
                          <Shield className="w-3.5 h-3.5" /> Manage Roles
                        </button>
                        <button onClick={() => { onDelete(u.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" /> Remove User
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
        <span className="text-xs text-muted-foreground">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, users.length)} of {users.length}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => onPageChange(p)}
              className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-all',
                page === p ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-muted-foreground')}>
              {p}
            </button>
          ))}
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
