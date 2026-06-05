import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Users, Mail, Activity, ArrowLeft, UserPlus, Settings, Hash } from 'lucide-react';
import type { ProjectGroup } from './types';
import { mockGroups, mockInvitations, mockActivity } from './mockData';
import GroupCard from './GroupCard';
import MemberCard from './MemberCard';
import InvitationCard from './InvitationCard';
import ActivityTimeline from './ActivityTimeline';
import AvatarStack from './AvatarStack';
import CreateGroupModal from './CreateGroupModal';
import InviteModal from './InviteModal';

type Tab = 'groups' | 'invitations' | 'activity';

export default function GroupManagement() {
  const [tab, setTab] = useState<Tab>('groups');
  const [groups, setGroups] = useState(mockGroups);
  const [invitations, setInvitations] = useState(mockInvitations);
  const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'groups', label: 'My Groups', icon: Users },
    { id: 'invitations', label: 'Invitations', icon: Mail, badge: pendingCount },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  const handleCreate = (data: { name: string; description: string; topic: string; maxMembers: number; tags: string[] }) => {
    const newGroup: ProjectGroup = {
      id: String(Date.now()), name: data.name, description: data.description, topic: data.topic,
      maxMembers: data.maxMembers, createdAt: new Date().toISOString().split('T')[0], status: 'forming', tags: data.tags,
      members: [{ id: 'me', name: 'Krush Gabani', email: 'krush@uni.edu', avatar: 'Krush', role: 'leader', status: 'active', joinedAt: new Date().toISOString().split('T')[0] }],
    };
    setGroups([newGroup, ...groups]);
  };

  const handleAccept = (id: string) => setInvitations(invitations.map(i => i.id === id ? { ...i, status: 'accepted' as const } : i));
  const handleReject = (id: string) => setInvitations(invitations.map(i => i.id === id ? { ...i, status: 'rejected' as const } : i));

  const handlePromote = (memberId: string) => {
    if (!selectedGroup) return;
    setGroups(groups.map(g => g.id === selectedGroup.id ? {
      ...g, members: g.members.map(m => ({ ...m, role: m.id === memberId ? 'leader' as const : m.role === 'leader' ? 'member' as const : m.role }))
    } : g));
    setSelectedGroup(prev => prev ? {
      ...prev, members: prev.members.map(m => ({ ...m, role: m.id === memberId ? 'leader' as const : m.role === 'leader' ? 'member' as const : m.role }))
    } : null);
  };

  const handleRemove = (memberId: string) => {
    if (!selectedGroup) return;
    setGroups(groups.map(g => g.id === selectedGroup.id ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g));
    setSelectedGroup(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : null);
  };

  // Detail View
  if (selectedGroup) {
    const isLeader = selectedGroup.members.some(m => m.id === '1' && m.role === 'leader');
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </button>

        {/* Group Header */}
        <div className="relative rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] to-purple-500/[0.03] pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
                <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider',
                  selectedGroup.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                )}>{selectedGroup.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{selectedGroup.description}</p>
              <div className="flex items-center gap-2">
                {selectedGroup.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Hash className="w-2.5 h-2.5" />{t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AvatarStack members={selectedGroup.members} max={5} size="lg" />
              {isLeader && (
                <button onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                  <UserPlus className="w-4 h-4" /> Invite
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Members Grid + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400" /> Members ({selectedGroup.members.length}/{selectedGroup.maxMembers})</h3>
              {isLeader && <button className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Settings className="w-4 h-4" /></button>}
            </div>
            <div className="space-y-2">
              {selectedGroup.members.map(m => (
                <MemberCard key={m.id} member={m} isLeader={isLeader} onPromote={handlePromote} onRemove={handleRemove} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
              <h4 className="font-semibold text-sm mb-3">Group Info</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Topic</span><span className="font-medium text-indigo-400">{selectedGroup.topic}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{selectedGroup.createdAt}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{selectedGroup.members.length}/{selectedGroup.maxMembers}</span></div>
                <div className="w-full h-1.5 rounded-full bg-white/5 mt-1">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${(selectedGroup.members.length / selectedGroup.maxMembers) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
              <h4 className="font-semibold text-sm mb-3">Recent Activity</h4>
              <ActivityTimeline items={mockActivity.slice(0, 3)} />
            </div>
          </div>
        </div>

        <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} groupName={selectedGroup.name} onInvite={() => {}} />
      </div>
    );
  }

  // Main List View
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground text-sm">Create groups, invite teammates, and manage your project teams</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Groups', value: groups.length, color: 'from-indigo-500 to-blue-500' },
          { label: 'Team Members', value: groups.reduce((a, g) => a + g.members.length, 0), color: 'from-emerald-500 to-teal-500' },
          { label: 'Pending Invites', value: pendingCount, color: 'from-amber-500 to-orange-500' },
          { label: 'Active Groups', value: groups.filter(g => g.status === 'active').length, color: 'from-purple-500 to-pink-500' },
        ].map(s => (
          <div key={s.label} className="relative rounded-xl p-4 bg-white/[0.03] border border-white/[0.06] overflow-hidden group hover:border-white/[0.12] transition-all">
            <div className={cn('absolute top-0 right-0 w-16 h-16 rounded-full bg-gradient-to-br opacity-10 -mr-4 -mt-4 group-hover:opacity-20 transition-opacity', s.color)} />
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge ? <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map(g => <GroupCard key={g.id} group={g} onSelect={setSelectedGroup} />)}
        </div>
      )}

      {tab === 'invitations' && (
        <div className="max-w-2xl space-y-3">
          {invitations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No invitations yet</p>
            </div>
          ) : invitations.map(i => (
            <InvitationCard key={i.id} invitation={i} onAccept={handleAccept} onReject={handleReject} />
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <div className="max-w-2xl rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06]">
          <ActivityTimeline items={mockActivity} />
        </div>
      )}

      <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
    </div>
  );
}
