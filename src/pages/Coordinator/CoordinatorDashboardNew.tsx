import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Users, BookOpen, AlertOctagon, TrendingUp, Sparkles, Activity, Zap } from 'lucide-react';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

// Dummy data for charts until Phase 5
const workloadData = [
  { name: "Smith", groups: 5 }, 
  { name: "Jenkins", groups: 4 },
  { name: "Davis", groups: 8 }, 
  { name: "Wilson", groups: 3 },
  { name: "Taylor", groups: 6 },
  { name: "Brown", groups: 2 }
];

const radarData = [
  { subject: 'PO1', A: 120, fullMark: 150 },
  { subject: 'PO2', A: 98, fullMark: 150 },
  { subject: 'PO3', A: 86, fullMark: 150 },
  { subject: 'PO4', A: 99, fullMark: 150 },
  { subject: 'PO5', A: 85, fullMark: 150 },
  { subject: 'PO6', A: 65, fullMark: 150 },
];

export const CoordinatorDashboardNew: React.FC = () => {
    const { token } = useAuthStore();
    const [stats, setStats] = useState({ totalGroups: 0, unassigned: 0, active: 0, totalStudents: 0 });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setIsLoading(true);
                const groupsData = await api.getGroups(token);
                const groupList = Array.isArray(groupsData) ? groupsData : [];
                if (groupList.length > 0) {
                    const totalStudents = groupList.reduce((acc, g) => acc + parseInt(g.member_count || '0', 10), 0);
                    setStats({
                        totalGroups: groupList.length,
                        unassigned: groupList.filter(g => g.status === 'WAITING_ALLOCATION').length,
                        active: groupList.filter(g => g.status === 'ACTIVE').length,
                        totalStudents: totalStudents
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [token]);

    return (
        <AppShell currentPage="/coordinator/dashboard">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Coordinator Analytics</h2>
                        <p className="text-white/60 mt-1 text-lg">Department-level insights, PSO tracking, and workload distribution.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={async () => {
                                try {
                                    if (token) {
                                        await api.triggerReminders(token);
                                        alert('Overdue reminders check triggered successfully! System alerts have been sent to applicable groups.');
                                    }
                                } catch (err: any) {
                                    alert(err.message || 'Failed to trigger reminders');
                                }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-2"
                        >
                            <AlertOctagon className="w-4 h-4" /> Trigger Overdue Reminders
                        </button>
                        <button className="px-4 py-2 bg-slate-800 border border-white/10 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Export Analytics
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Total Students", val: isLoading ? "..." : String(stats.totalStudents), trend: "Active in system", icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', glow: 'shadow-indigo-500/5' },
                        { label: "Total Projects", val: isLoading ? "..." : String(stats.totalGroups), trend: "Formed groups", icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/5' },
                        { label: "Unassigned", val: isLoading ? "..." : String(stats.unassigned), trend: "Requires guide", icon: AlertOctagon, color: 'text-rose-400', bg: 'bg-rose-500/10', glow: 'shadow-rose-500/5' },
                        { label: "Avg Milestone Comp.", val: "68%", trend: "+12% MoM", icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/5' },
                    ].map((k, i) => (
                        <motion.div 
                            key={i} 
                            whileHover={{ y: -4 }}
                            className={`p-6 rounded-2xl border border-white/10 bg-white/5 shadow-sm hover:shadow-xl hover:${k.glow} transition-all relative overflow-hidden backdrop-blur-sm`}
                        >
                            <div className="flex justify-between items-start z-10 relative">
                                <div>
                                    <p className="text-sm font-medium text-white/50 mb-1">{k.label}</p>
                                    <h3 className="text-4xl font-bold tracking-tight text-white">{k.val}</h3>
                                </div>
                                <div className={`p-3 rounded-xl ${k.bg}`}>
                                    <k.icon className={`w-6 h-6 ${k.color}`} />
                                </div>
                            </div>
                            <div className="mt-4 text-sm font-medium text-emerald-400 relative z-10">{k.trend}</div>
                            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl z-0 ${k.bg}`} />
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 p-6 rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-400" /> Guide Workload Distribution</h3>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workloadData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                        contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Bar dataKey="groups" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        {workloadData.map((e, i) => (
                                            <Cell key={i} fill={e.groups > 6 ? '#ef4444' : e.groups < 3 ? '#10b981' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 shadow-sm flex flex-col backdrop-blur-sm">
                        <h3 className="text-xl font-bold mb-2 text-white">PO/PSO Attainment Tracking</h3>
                        <p className="text-sm text-white/50 mb-6">Department-wide coverage analysis across all projects.</p>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 12}} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name="Attainment" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shadow-sm flex flex-col lg:flex-row gap-6 items-center backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 text-white">AI Coordinator Insights</h3>
                        <p className="text-white/70">
                            The system has detected that you have <strong className="text-white">{stats.unassigned}</strong> groups waiting for a guide. 
                            Head over to the <strong className="text-white">Allocations</strong> tab to assign them to available faculty members based on their workload capacity.
                        </p>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
