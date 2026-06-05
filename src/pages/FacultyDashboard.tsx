import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CheckSquare, Calendar, BarChart3, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const data = [
  { name: 'Week 1', workload: 20 },
  { name: 'Week 2', workload: 35 },
  { name: 'Week 3', workload: 30 },
  { name: 'Week 4', workload: 55 },
  { name: 'Week 5', workload: 40 },
  { name: 'Week 6', workload: 65 },
];

const studentGroups = [
  { id: 'G-14', name: 'Alpha AI', domain: 'Machine Learning', progress: 65, status: 'On Track', risk: 'Low' },
  { id: 'G-08', name: 'Cyber Shield', domain: 'Cybersecurity', progress: 40, status: 'At Risk', risk: 'High' },
  { id: 'G-22', name: 'Cloud Sync', domain: 'Cloud Computing', progress: 85, status: 'Ahead', risk: 'Low' },
  { id: 'G-11', name: 'Block Vote', domain: 'Blockchain', progress: 50, status: 'Review Needed', risk: 'Medium' },
];

export default function FacultyDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Faculty Guide Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-lg">Monitor assigned student groups and workload.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-indigo-500/10 text-indigo-500 font-medium rounded-lg hover:bg-indigo-500/20 transition-colors">
            Generate Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
            Review Pending (8)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Assigned Groups', val: '12', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pending Approvals', val: '8', icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Upcoming Reviews', val: '4', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Avg Progress', val: '62%', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((k, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div className="z-10 relative">
                <p className="text-sm font-medium text-muted-foreground mb-2">{k.label}</p>
                <h3 className="text-4xl font-bold tracking-tight">{k.val}</h3>
              </div>
              <div className={cn("p-3 rounded-xl z-10 relative", k.bg)}>
                <k.icon className={cn("w-6 h-6", k.color)} />
              </div>
            </div>
            <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl z-0", k.bg)} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Assigned Student Groups</h3>
            <button className="text-sm font-medium text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-sm text-muted-foreground">
                  <th className="pb-4 font-medium pl-4">Group details</th>
                  <th className="pb-4 font-medium">Domain</th>
                  <th className="pb-4 font-medium">Progress</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {studentGroups.map(g => (
                  <tr key={g.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-500">
                          {g.id.split('-')[1]}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{g.name}</div>
                          <div className="text-xs text-muted-foreground">{g.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">{g.domain}</span>
                    </td>
                    <td className="py-4 w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={g.progress} className="h-1.5" />
                        <span className="text-xs font-medium w-8">{g.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-full border",
                        g.risk === 'Low' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                        g.risk === 'High' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        {g.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Workload Trend
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWorkload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="workload" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWorkload)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-sm flex-1">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" /> AI Insights & Alerts
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-500/20 bg-card/50 backdrop-blur-sm">
                <h4 className="font-bold text-sm text-foreground">Group G-08 "Cyber Shield"</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Has missed 2 consecutive logbook submissions. AI predicts a high risk of milestone failure.
                </p>
                <button className="mt-3 text-xs font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider">Schedule Meeting →</button>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-card/50 backdrop-blur-sm">
                <h4 className="font-bold text-sm text-foreground">Group G-11 "Block Vote"</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Pending architecture review for over 3 days. Proceeding to next phase requires approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
