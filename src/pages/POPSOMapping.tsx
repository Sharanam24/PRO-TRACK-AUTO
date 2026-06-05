import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { 
  Grid3x3, Download, TrendingUp, CheckCircle2,
  AlertTriangle, FileBarChart, Target, Save, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

// Program Outcomes
const POs = ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11", "PO12"];
const PSOs = ["PSO1", "PSO2", "PSO3"];

// Rubric Criteria
const criteria = [
  { id: "problem", label: "Problem Identification" },
  { id: "lit", label: "Literature Survey" },
  { id: "method", label: "Methodology" },
  { id: "impl", label: "Implementation" },
  { id: "pres", label: "Presentation" },
  { id: "team", label: "Teamwork" },
  { id: "docs", label: "Documentation" },
];

/** Build a zero-filled default matrix for all criteria × outcomes. */
function buildDefaultMatrix(outcomeList: string[]): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const c of criteria) {
    matrix[c.id] = {};
    for (const o of outcomeList) {
      matrix[c.id][o] = 0;
    }
  }
  return matrix;
}

/**
 * Merge an API-returned sparse matrix (may be missing criteria/outcomes)
 * with the default zero matrix so every cell always has a value.
 */
function mergeWithDefaults(
  apiMatrix: Record<string, Record<string, number>>,
  outcomeList: string[]
): Record<string, Record<string, number>> {
  const base = buildDefaultMatrix(outcomeList);
  for (const c of criteria) {
    if (apiMatrix[c.id]) {
      for (const o of outcomeList) {
        if (apiMatrix[c.id][o] !== undefined) {
          base[c.id][o] = apiMatrix[c.id][o];
        }
      }
    }
  }
  return base;
}

const levelLabels: Record<number, { label: string; bg: string; text: string }> = {
  0: { label: "-", bg: "bg-transparent", text: "text-muted-foreground" },
  1: { label: "L", bg: "bg-amber-500/20", text: "text-amber-500" },
  2: { label: "M", bg: "bg-blue-500/20", text: "text-blue-500" },
  3: { label: "H", bg: "bg-emerald-500/20", text: "text-emerald-500" },
};

export default function POPSOMapping() {
  const { token, user } = useAuthStore();
  const batchYear = user?.batch_year ?? new Date().getFullYear();

  const [activeTab, setActiveTab] = useState<"po" | "pso" | "attainment">("po");
  const [poMatrix, setPOMatrix] = useState<Record<string, Record<string, number>>>(buildDefaultMatrix(POs));
  const [psoMatrix, setPSOMatrix] = useState<Record<string, Record<string, number>>>(buildDefaultMatrix(PSOs));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMappings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [poRes, psoRes] = await Promise.all([
        fetch(`/api/mappings?batch_year=${batchYear}&type=PO`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
        fetch(`/api/mappings?batch_year=${batchYear}&type=PSO`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
      ]);
      setPOMatrix(mergeWithDefaults(poRes.mappings ?? {}, POs));
      setPSOMatrix(mergeWithDefaults(psoRes.mappings ?? {}, PSOs));
    } catch (err) {
      console.error('Failed to load mappings', err);
      showToast('error', 'Failed to load mappings from server');
    } finally {
      setIsLoading(false);
    }
  }, [token, batchYear]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await Promise.all([
        fetch('/api/mappings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ batch_year: batchYear, type: 'PO', mappings: poMatrix }),
        }).then(async r => {
          if (!r.ok) {
            const err = await r.json();
            throw new Error(err.error || 'Failed to save PO mappings');
          }
        }),
        fetch('/api/mappings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ batch_year: batchYear, type: 'PSO', mappings: psoMatrix }),
        }).then(async r => {
          if (!r.ok) {
            const err = await r.json();
            throw new Error(err.error || 'Failed to save PSO mappings');
          }
        }),
      ]);
      showToast('success', 'PO/PSO mappings saved successfully');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save mappings');
    } finally {
      setIsSaving(false);
    }
  };

  const cyclePO = (criteriaId: string, po: string) => {
    setPOMatrix(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], [po]: ((prev[criteriaId][po] + 1) % 4) }
    }));
  };

  const cyclePSO = (criteriaId: string, pso: string) => {
    setPSOMatrix(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], [pso]: ((prev[criteriaId][pso] + 1) % 4) }
    }));
  };

  // Calculate PO attainment scores (avg of all criteria mapped to each PO)
  const poAttainment = useMemo(() => {
    return POs.map(po => {
      const vals = criteria.map(c => poMatrix[c.id][po]);
      const mapped = vals.filter(v => v > 0);
      const avg = mapped.length ? (vals.reduce((a, b) => a + b, 0) / (criteria.length * 3)) * 100 : 0;
      return { name: po, value: Math.round(avg), threshold: 60 };
    });
  }, [poMatrix]);

  const psoAttainment = useMemo(() => {
    return PSOs.map(pso => {
      const vals = criteria.map(c => psoMatrix[c.id][pso]);
      const avg = (vals.reduce((a, b) => a + b, 0) / (criteria.length * 3)) * 100;
      return { name: pso, value: Math.round(avg), threshold: 60 };
    });
  }, [psoMatrix]);

  const totalMapped = useMemo(() => {
    return criteria.reduce((acc, c) => acc + POs.filter(po => poMatrix[c.id][po] > 0).length, 0);
  }, [poMatrix]);

  const overallAttainment = useMemo(() => {
    const all = poAttainment.map(p => p.value);
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  }, [poAttainment]);

  const aboveThreshold = poAttainment.filter(p => p.value >= p.threshold).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Grid3x3 className="w-8 h-8 text-purple-500" />
            </div>
            PO / PSO Mapping
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Accreditation-ready program outcome attainment dashboard.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-white/10 bg-card rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 font-medium text-sm">
            <FileBarChart className="w-4 h-4" /> Export Report
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium text-sm shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Mappings'}
          </button>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium text-sm shadow-lg shadow-purple-500/20">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Mappings", val: totalMapped, sub: `of ${criteria.length * POs.length} possible`, icon: Grid3x3, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Overall Attainment", val: `${overallAttainment}%`, sub: "Avg across all POs", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "POs Above Target", val: `${aboveThreshold}/${POs.length}`, sub: "Target: 60% attainment", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "POs Need Attention", val: POs.length - aboveThreshold, sub: "Below threshold", icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((k, i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/5 bg-card shadow-sm relative overflow-hidden hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{k.label}</p>
                <h3 className="text-3xl font-bold tracking-tight">{k.val}</h3>
                <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
              </div>
              <div className={cn("p-3 rounded-xl", k.bg)}>
                <k.icon className={cn("w-5 h-5", k.color)} />
              </div>
            </div>
            <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-3xl z-0", k.bg)} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-white/5 rounded-xl shadow-sm w-max">
        {(["po", "pso", "attainment"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize",
              activeTab === tab ? "bg-purple-500/10 text-purple-400" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            {tab === "po" ? "PO Matrix" : tab === "pso" ? "PSO Matrix" : "Attainment Charts"}
          </button>
        ))}
      </div>
      {/* PO Matrix */}
      {activeTab === "po" && (
        <div className="rounded-2xl border border-white/5 bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Criteria → PO Mapping Matrix</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Click any cell to cycle: — → Low → Medium → High</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              {[1, 2, 3].map(l => (
                <span key={l} className={cn("px-2 py-1 rounded", levelLabels[l].bg, levelLabels[l].text)}>
                  {l === 1 ? "L – Low" : l === 2 ? "M – Medium" : "H – High"}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 font-bold text-muted-foreground w-44 min-w-44 sticky left-0 bg-card z-10">Criteria / CO</th>
                  {POs.map(po => (
                    <th key={po} className="p-3 font-bold text-center text-purple-400 w-16 min-w-16">{po}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {criteria.map((c, ri) => (
                  <tr key={c.id} className={cn("hover:bg-white/2 transition-colors", ri % 2 === 0 ? "" : "bg-white/[0.02]")}>
                    <td className="p-4 font-semibold text-foreground sticky left-0 bg-card z-10 border-r border-white/5">
                      {c.label}
                    </td>
                    {POs.map(po => {
                      const level = poMatrix[c.id][po];
                      const l = levelLabels[level];
                      return (
                        <td key={po} className="p-2 text-center">
                          <button
                            onClick={() => cyclePO(c.id, po)}
                            className={cn(
                              "w-10 h-10 rounded-lg font-bold transition-all hover:scale-110 border",
                              level === 0 ? "border-white/5 hover:border-white/20" : "border-transparent",
                              l.bg, l.text
                            )}
                            title={`Click to change: ${c.label} → ${po}`}
                          >
                            {l.label}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PSO Matrix */}
      {activeTab === "pso" && (
        <div className="rounded-2xl border border-white/5 bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Criteria → PSO Mapping Matrix</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Click any cell to cycle: — → Low → Medium → High</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              {[1, 2, 3].map(l => (
                <span key={l} className={cn("px-2 py-1 rounded", levelLabels[l].bg, levelLabels[l].text)}>
                  {l === 1 ? "L – Low" : l === 2 ? "M – Medium" : "H – High"}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left pb-4 font-bold text-muted-foreground w-52">Criteria</th>
                  {PSOs.map(pso => (
                    <th key={pso} className="pb-4 font-bold text-center text-purple-400 w-32">{pso}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {criteria.map((c, ri) => (
                  <tr key={c.id} className={cn("hover:bg-white/2 transition-colors", ri % 2 === 0 ? "" : "bg-white/[0.02]")}>
                    <td className="py-3 font-semibold text-foreground pr-4">{c.label}</td>
                    {PSOs.map(pso => {
                      const level = psoMatrix[c.id][pso];
                      const l = levelLabels[level];
                      return (
                        <td key={pso} className="py-3 text-center">
                          <button
                            onClick={() => cyclePSO(c.id, pso)}
                            className={cn(
                              "w-16 h-10 rounded-lg font-bold transition-all hover:scale-110 border",
                              level === 0 ? "border-white/5 hover:border-white/20" : "border-transparent",
                              l.bg, l.text
                            )}
                          >
                            {l.label}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attainment Charts */}
      {activeTab === "attainment" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* PO Attainment Chart */}
            <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" /> PO Attainment (%)
                </h3>
                <p className="text-sm text-muted-foreground">Dashed line = 60% target threshold</p>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={poAttainment} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(9,9,11,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      formatter={(val: any) => [`${val}%`, "Attainment"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {poAttainment.map((entry, i) => (
                        <Cell key={i} fill={entry.value >= entry.threshold ? "#8b5cf6" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PSO Attainment Chart */}
            <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" /> PSO Attainment (%)
                </h3>
                <p className="text-sm text-muted-foreground">Program-specific outcome coverage</p>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={psoAttainment} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 13 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(9,9,11,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      formatter={(val: any) => [`${val}%`, "Attainment"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                      {psoAttainment.map((entry, i) => (
                        <Cell key={i} fill={entry.value >= entry.threshold ? "#6366f1" : "#f59e0b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Attainment Summary Table */}
          <div className="rounded-2xl border border-white/5 bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-bold text-lg">Detailed Attainment Report</h3>
              <p className="text-sm text-muted-foreground">Accreditation-ready PO-wise summary</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left p-4 font-semibold">Program Outcome</th>
                    <th className="text-left p-4 font-semibold">Description</th>
                    <th className="text-center p-4 font-semibold">Attainment %</th>
                    <th className="text-center p-4 font-semibold">Target</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {poAttainment.map((po, i) => {
                    const poDescriptions: Record<string, string> = {
                      PO1: "Engineering Knowledge", PO2: "Problem Analysis", PO3: "Design Solutions",
                      PO4: "Conduct Investigations", PO5: "Modern Tool Usage", PO6: "Engineer & Society",
                      PO7: "Environment & Sustainability", PO8: "Ethics", PO9: "Team Work",
                      PO10: "Communication", PO11: "Project Management", PO12: "Life-long Learning",
                    };
                    const met = po.value >= po.threshold;
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-purple-400">{po.name}</td>
                        <td className="p-4 text-muted-foreground">{poDescriptions[po.name]}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", met ? "bg-purple-500" : "bg-rose-500")}
                                style={{ width: `${po.value}%` }}
                              />
                            </div>
                            <span className={cn("font-bold w-10 text-right", met ? "text-purple-400" : "text-rose-400")}>{po.value}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">60%</td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-bold border",
                            met ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}>
                            {met ? "✓ Achieved" : "✗ Below Target"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
