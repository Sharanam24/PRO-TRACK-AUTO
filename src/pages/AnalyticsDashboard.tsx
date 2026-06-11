import { useState, useEffect } from "react";
import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, Scatter, ScatterChart, Cell
} from "recharts";
import {
  TrendingUp, Users, Target, Activity, AlertTriangle,
  Sparkles, Download, CheckCircle2, AlertOctagon, BrainCircuit, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  total_active_groups: number;
  avg_final_marks: number;
  at_risk_count: number;
  guide_workload: { faculty_id: string; email: string; current_workload: number; max_workload: number }[];
}

interface TrendRow {
  week_number: number;
  avg_total_marks: number;
  eval_count: number;
}

interface AtRiskGroup {
  group_id: string;
  group_name: string;
  guide_email: string | null;
  member_count: number;
  last_logbook_date: string | null;
  task_completion_pct: number;
  reasons: { lowLogbooks: boolean; lowTaskCompletion: boolean; missingEvaluation: boolean };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { token } = useAuthStore();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [atRiskGroups, setAtRiskGroups] = useState<AtRiskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    setLoading(true);
    setError(null);

    Promise.all([
      fetch('/api/analytics/coordinator/dashboard', { headers }).then(r => r.json()),
      fetch('/api/analytics/coordinator/trends', { headers }).then(r => r.json()),
      fetch('/api/analytics/coordinator/at-risk', { headers }).then(r => r.json()),
    ])
      .then(([dashRes, trendsRes, atRiskRes]) => {
        setDashboard(dashRes as DashboardData);
        setTrends(Array.isArray(trendsRes) ? trendsRes : []);
        setAtRiskGroups(Array.isArray(atRiskRes) ? atRiskRes : []);
      })
      .catch((err) => {
        console.error('Analytics fetch error:', err);
        setError('Failed to load analytics data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Map trend rows to chart format
  const performanceTrends = trends.map((t) => ({
    name: `Week ${t.week_number}`,
    avgScore: Math.round(t.avg_total_marks ?? 0),
    completedTasks: t.eval_count,
    expected: 75, // baseline
  }));

  // Map at-risk groups to scatter format
  const riskDistribution = atRiskGroups.map((g) => ({
    x: Math.round(g.task_completion_pct),
    y: Math.round(g.task_completion_pct), // proxy for both axes until per-group scores are tracked
    z: 200,
    name: g.group_name,
    status: g.reasons.lowLogbooks || g.reasons.missingEvaluation ? 'high_risk'
          : g.reasons.lowTaskCompletion ? 'medium_risk' : 'low_risk',
  }));

  // Generate AI-style insights from live data
  const insights = [];
  if (dashboard) {
    if (dashboard.avg_final_marks >= 70) {
      insights.push({ type: 'positive', title: 'Strong Performance', desc: `Avg final marks are ${dashboard.avg_final_marks.toFixed(1)} — above the 70% threshold.`, icon: Target });
    }
    if (dashboard.at_risk_count > 0) {
      insights.push({ type: 'warning', title: 'Groups Need Attention', desc: `${dashboard.at_risk_count} group${dashboard.at_risk_count > 1 ? 's are' : ' is'} currently flagged as at-risk.`, icon: AlertTriangle });
    }
    const firstAtRisk = atRiskGroups[0];
    if (firstAtRisk) {
      insights.push({ type: 'danger', title: 'Critical Risk Detected', desc: `${firstAtRisk.group_name} has ${firstAtRisk.task_completion_pct.toFixed(0)}% task completion.`, icon: AlertOctagon });
    }
  }
  // Fallback insight when no data yet
  if (insights.length === 0 && !loading) {
    insights.push({ type: 'positive', title: 'All Clear', desc: 'No at-risk groups detected at this time.', icon: CheckCircle2 });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-muted-foreground">Loading analytics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-rose-400 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Activity className="w-8 h-8 text-indigo-500" />
            </div>
            Department Analytics
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">AI-powered enterprise insights and performance tracking.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Build CSV from current analytics data
              const lines: string[] = [];

              // Summary
              lines.push('Summary');
              lines.push('Metric,Value');
              lines.push(`Active Groups,${dashboard?.total_active_groups ?? 0}`);
              lines.push(`Guide Count,${dashboard?.guide_workload?.length ?? 0}`);
              lines.push(`Avg Final Marks,${dashboard ? dashboard.avg_final_marks.toFixed(1) : 0}`);
              lines.push(`At-Risk Groups,${dashboard?.at_risk_count ?? 0}`);
              lines.push('');

              // Performance trends
              lines.push('Performance Trends');
              lines.push('Week,Avg Score,Eval Count');
              trends.forEach(t => {
                lines.push(`Week ${t.week_number},${Math.round(t.avg_total_marks ?? 0)},${t.eval_count}`);
              });
              lines.push('');

              // At-risk groups
              lines.push('At-Risk Groups');
              lines.push('Group Name,Guide Email,Members,Task Completion %,Risk Level');
              atRiskGroups.forEach(g => {
                lines.push(`"${g.group_name}","${g.guide_email ?? ''}",${g.member_count},${g.task_completion_pct.toFixed(1)},${g.risk_level}`);
              });

              const csv = lines.join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 border border-white/10 bg-card font-medium rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Active Groups",
            val: String(dashboard?.total_active_groups ?? 0),
            trend: "Currently active",
            icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10'
          },
          {
            label: "Guide Count",
            val: String(dashboard?.guide_workload?.length ?? 0),
            trend: "Assigned guides",
            icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/10'
          },
          {
            label: "Avg Final Marks",
            val: dashboard ? `${dashboard.avg_final_marks.toFixed(1)}` : '–',
            trend: "Across all groups",
            icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10'
          },
          {
            label: "At-Risk Groups",
            val: String(dashboard?.at_risk_count ?? 0),
            trend: "Need intervention",
            icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-rose-500/10'
          },
        ].map((k, i) => (
          <div
            key={i}
            className={cn(
              "p-6 rounded-2xl border bg-card shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden",
              k.border, k.glow
            )}
          >
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{k.label}</p>
                <h3 className="text-4xl font-bold tracking-tight text-foreground">{k.val}</h3>
              </div>
              <div className={cn("p-3 rounded-xl", k.bg)}>
                <k.icon className={cn("w-6 h-6", k.color)} />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-muted-foreground relative z-10">{k.trend}</div>
            <div className={cn("absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-20 blur-3xl z-0", k.bg)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <div className="xl:col-span-2 p-6 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold">Performance & Milestone Trends</h3>
              <p className="text-sm text-muted-foreground">Department-wide average scores vs expected baseline.</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500" /> Avg Score</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500" /> Expected</span>
            </div>
          </div>
          <div className="flex-1 min-h-[350px]">
            {performanceTrends.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No evaluation data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceTrends} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="completedTasks" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Area type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={3} fill="url(#scoreGradient)" />
                  <Line type="monotone" dataKey="expected" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 shadow-sm relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="w-24 h-24" />
            </div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400 relative z-10">
              <Sparkles className="w-5 h-5" /> Nexus AI Insights
            </h3>
            <div className="space-y-4 relative z-10">
              {insights.map((insight, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      insight.type === 'positive' ? "bg-emerald-500/20 text-emerald-500" :
                      insight.type === 'warning' ? "bg-amber-500/20 text-amber-500" :
                      "bg-rose-500/20 text-rose-500"
                    )}>
                      <insight.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Heatmap (Scatter Plot) */}
      <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Group Risk vs Progress Analysis</h3>
          <p className="text-sm text-muted-foreground">At-risk groups by task completion rate.</p>
        </div>
        <div className="h-[300px] w-full">
          {riskDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No at-risk groups detected.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="Task Completion %" unit="%" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <YAxis type="number" dataKey="y" name="Score" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Scatter name="Groups" data={riskDistribution}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.status === 'high_risk' ? '#ef4444' :
                      entry.status === 'medium_risk' ? '#f59e0b' : '#10b981'
                    } />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
