import { useState, useMemo } from 'react';
import { Plus, Upload, Download, Trash2, Users } from 'lucide-react';
import type { ManagedUser, FilterState } from './types';
import { mockUsers } from './mockData';
import StatsRow from './StatsRow';
import FilterBar from './FilterBar';
import UserTable from './UserTable';
import UserModal from './UserModal';
import RoleDialog from './RoleDialog';
import BulkUpload from './BulkUpload';

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [filters, setFilters] = useState<FilterState>({ search: '', role: 'all', department: 'all', status: 'all', academicYear: 'all' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [roleUser, setRoleUser] = useState<ManagedUser | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const pageSize = 8;

  // Filter logic
  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.enrollmentId.toLowerCase().includes(q);
      const matchRole = filters.role === 'all' || u.role === filters.role;
      const matchDept = filters.department === 'all' || u.department === filters.department;
      const matchStatus = filters.status === 'all' || u.status === filters.status;
      const matchYear = filters.academicYear === 'all' || u.academicYear === filters.academicYear;
      return matchSearch && matchRole && matchDept && matchStatus && matchYear;
    });
  }, [users, filters]);

  // Stats
  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    students: users.filter(u => u.role === 'student').length,
    faculty: users.filter(u => u.role === 'faculty').length,
    committees: users.filter(u => u.role === 'committee').length,
    departments: new Set(users.map(u => u.department)).size,
  }), [users]);

  // Handlers
  const handleSaveUser = (data: Partial<ManagedUser>) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data } as ManagedUser : u));
    } else {
      setUsers([data as ManagedUser, ...users]);
    }
    setEditingUser(null);
  };

  const handleDelete = (id: string) => { setUsers(users.filter(u => u.id !== id)); setSelectedIds(selectedIds.filter(s => s !== id)); };
  const handleBulkDelete = () => { setUsers(users.filter(u => !selectedIds.includes(u.id))); setSelectedIds([]); };
  const handleSavePerms = (userId: string, perms: string[]) => setUsers(users.map(u => u.id === userId ? { ...u, permissions: perms } : u));

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAll = () => {
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    const allSel = paged.every(u => selectedIds.includes(u.id));
    setSelectedIds(allSel ? selectedIds.filter(s => !paged.find(u => u.id === s)) : [...new Set([...selectedIds, ...paged.map(u => u.id)])]);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-indigo-400" /> User Management</h2>
          <p className="text-muted-foreground text-sm">Manage students, faculty, committees, and permissions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all">
            <Upload className="w-4 h-4" /> CSV Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { setEditingUser(null); setShowUserModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow data={stats} />

      {/* Filters */}
      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} resultCount={filtered.length} />

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-medium text-indigo-400">{selectedIds.length} selected</span>
          <div className="flex-1" />
          <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-semibold transition-all">
            <Trash2 className="w-3 h-3" /> Delete Selected
          </button>
          <button onClick={() => setSelectedIds([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
        </div>
      )}

      {/* Table */}
      <UserTable
        users={filtered}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onEdit={u => { setEditingUser(u); setShowUserModal(true); }}
        onRoles={u => setRoleUser(u)}
        onDelete={handleDelete}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* Modals */}
      <UserModal isOpen={showUserModal} onClose={() => { setShowUserModal(false); setEditingUser(null); }} onSave={handleSaveUser} user={editingUser} />
      <RoleDialog isOpen={!!roleUser} onClose={() => setRoleUser(null)} user={roleUser} onSave={handleSavePerms} />
      <BulkUpload isOpen={showBulkUpload} onClose={() => setShowBulkUpload(false)} onUpload={() => setShowBulkUpload(false)} />
    </div>
  );
}
