import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { api } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Target, Users, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface PendingGroup {
    group_id: string;
    group_name: string;
    status: string;
    member_count: string | number;
    created_at: string;
}

interface AvailableGuide {
    faculty_id: string;
    email: string;
    expertise_tags: string[];
    current_workload: number;
    max_workload: number;
    available_slots: number;
}

export const CoordinatorAllocations: React.FC = () => {
    const { token } = useAuthStore();
    const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
    const [availableGuides, setAvailableGuides] = useState<AvailableGuide[]>([]);
    
    const [selectedGroup, setSelectedGroup] = useState<PendingGroup | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<AvailableGuide | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [pendingRes, guidesRes] = await Promise.all([
                api.getPendingAllocation(token),
                api.getAvailableGuides(token)
            ]);
            setPendingGroups(pendingRes.groups || []);
            setAvailableGuides(guidesRes.guides || []);
            
            // If currently selected group/guide is no longer available, deselect them
            if (selectedGroup && !pendingRes.groups?.find((g: any) => g.group_id === selectedGroup.group_id)) {
                setSelectedGroup(null);
            }
            if (selectedGuide && !guidesRes.guides?.find((g: any) => g.faculty_id === selectedGuide.faculty_id)) {
                setSelectedGuide(null);
            }
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to fetch allocation data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAssign = async () => {
        if (!selectedGroup || !selectedGuide || !token) return;
        setIsAssigning(true);
        try {
            await api.assignGuide(token, selectedGroup.group_id, selectedGuide.faculty_id);
            showToast('success', `Assigned ${selectedGuide.email.split('@')[0]} to ${selectedGroup.group_name}`);
            setSelectedGroup(null);
            setSelectedGuide(null);
            await fetchData();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to assign guide');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <AppShell currentPage="/coordinator/allocations">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-slide-up ${
                    toast.type === 'success'
                        ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-900/90 border-red-500/30 text-red-300'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                            <Target size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Guide Allocations</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Assign faculty guides to student project groups</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Loader2 size={14} />} Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                
                {/* Pending Groups Panel */}
                <div className="flex flex-col rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex justify-between items-center">
                            Pending Groups
                            <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-[10px]">
                                {pendingGroups.length} WAITLISTED
                            </span>
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {pendingGroups.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-white/30 text-sm">
                                <CheckCircle2 size={32} className="mx-auto mb-3 opacity-20" />
                                No pending groups to allocate.
                            </div>
                        )}
                        {pendingGroups.map(group => (
                            <button
                                key={group.group_id}
                                onClick={() => setSelectedGroup(group)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    selectedGroup?.group_id === group.group_id
                                        ? 'bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10'
                                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                                }`}
                            >
                                <h4 className={`text-sm font-bold mb-1 ${selectedGroup?.group_id === group.group_id ? 'text-orange-300' : 'text-white'}`}>
                                    {group.group_name}
                                </h4>
                                <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                                    <span className="flex items-center gap-1.5"><Users size={12} /> {group.member_count} Members</span>
                                    <span>Created: {new Date(group.created_at).toLocaleDateString()}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Available Guides Panel */}
                <div className="flex flex-col rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex justify-between items-center">
                            Available Faculty Guides
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
                                {availableGuides.length} AVAILABLE
                            </span>
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {availableGuides.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-red-300/50 text-sm">
                                <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
                                No faculty guides have available slots.
                            </div>
                        )}
                        {availableGuides.map(guide => (
                            <button
                                key={guide.faculty_id}
                                onClick={() => setSelectedGuide(guide)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    selectedGuide?.faculty_id === guide.faculty_id
                                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`text-sm font-bold ${selectedGuide?.faculty_id === guide.faculty_id ? 'text-emerald-300' : 'text-white'}`}>
                                        {guide.email}
                                    </h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                        guide.available_slots > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                    }`}>
                                        {guide.available_slots} slots left
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {guide.expertise_tags?.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white/60">
                                            {tag}
                                        </span>
                                    ))}
                                    {(!guide.expertise_tags || guide.expertise_tags.length === 0) && (
                                        <span className="text-[10px] text-white/30 italic">No expertise tags</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assignment Action Bar (Sticky at bottom if both selected) */}
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-300 ${
                    selectedGroup && selectedGuide 
                        ? 'opacity-100 translate-y-0 pointer-events-auto' 
                        : 'opacity-0 translate-y-8 pointer-events-none'
                }`}>
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 flex items-center gap-6 min-w-[500px]">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Assigning</p>
                            <p className="text-sm font-bold text-white truncate max-w-[200px]">{selectedGuide?.email.split('@')[0]}</p>
                        </div>
                        <div className="text-white/30">
                            <Target size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-1">To Group</p>
                            <p className="text-sm font-bold text-orange-300 truncate max-w-[200px]">{selectedGroup?.group_name}</p>
                        </div>
                        <button
                            onClick={handleAssign}
                            disabled={isAssigning}
                            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            {isAssigning ? 'Assigning...' : 'Confirm Allocation'}
                        </button>
                    </div>
                </div>

            </div>
            
            <style>{`
                @keyframes slide-up { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
                .animate-slide-up{animation:slide-up 0.3s ease-out}
            `}</style>
        </AppShell>
    );
};
