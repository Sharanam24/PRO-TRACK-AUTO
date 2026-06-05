import { Users, BookOpen, AlertOctagon, TrendingUp, Sparkles, ArrowRight, Activity, Zap } from "lucide-react";
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

export default function CoordinatorDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coordinator Analytics</h2>
          <p className="text-muted-foreground mt-1 text-lg">Department-level insights, PSO tracking, and workload distribution.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 border border-white/10 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4" /> Export Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Active Groups", val: "48", trend: "+2 this week", icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: "Active Faculty Guides", val: "12", trend: "Optimal load", icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: "At-Risk Groups", val: "3", trend: "-1 from last week", icon: AlertOctagon, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: "Avg Milestone Comp.", val: "68%", trend: "+12% MoM", icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((k, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{k.label}</p>
                <h3 className="text-4xl font-bold tracking-tight">{k.val}</h3>
              </div>
              <div className={cn("p-3 rounded-xl", k.bg)}>
                <k.icon className={cn("w-6 h-6", k.color)} />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-emerald-500 relative z-10">{k.trend}</div>
            <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl z-0", k.bg)} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500" /> Guide Workload Distribution</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
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

        <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-2">PO/PSO Attainment Tracking</h3>
          <p className="text-sm text-muted-foreground mb-6">Department-wide coverage analysis across all projects.</p>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 12}} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Attainment" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 text-foreground">AI Coordinator Insights</h3>
          <p className="text-muted-foreground">
            The AI has detected severe workload imbalances. <strong>Prof. Davis</strong> is overloaded with 8 groups, potentially impacting review quality. <strong>Prof. Brown</strong> has capacity for 4 more groups. 
          </p>
        </div>
        <button className="shrink-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all">
          Auto-Rebalance via AI <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
