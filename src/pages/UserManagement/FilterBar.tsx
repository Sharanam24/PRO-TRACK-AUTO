import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { FilterState } from './types';
import { departments, academicYears, roles, statuses } from './mockData';

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
}

export default function FilterBar({ filters, onChange, resultCount }: FilterBarProps) {
  const set = (key: keyof FilterState, val: string) => onChange({ ...filters, [key]: val });
  const hasFilters = filters.role !== 'all' || filters.department !== 'all' || filters.status !== 'all' || filters.academicYear !== 'all';

  const selectClass = "px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer";

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            placeholder="Search by name, email, or enrollment ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500 hidden md:block" />
          <select value={filters.role} onChange={e => set('role', e.target.value)} className={selectClass}>
            <option value="all">All Roles</option>
            {roles.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select value={filters.department} onChange={e => set('department', e.target.value)} className={selectClass}>
            <option value="all">All Depts</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.status} onChange={e => set('status', e.target.value)} className={selectClass}>
            <option value="all">All Status</option>
            {statuses.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={filters.academicYear} onChange={e => set('academicYear', e.target.value)} className={selectClass}>
            <option value="all">All Years</option>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Active filter chips + result count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{resultCount} user{resultCount !== 1 ? 's' : ''} found</span>
          {hasFilters && (
            <button onClick={() => onChange({ search: filters.search, role: 'all', department: 'all', status: 'all', academicYear: 'all' })}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
