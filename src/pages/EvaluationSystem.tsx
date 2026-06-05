import { useState, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { 
  ClipboardCheck, Users, Search, Save, 
  CheckCircle2, FileText, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

const criteria = [
  { id: "problem", label: "Problem Identification", max: 10 },
  { id: "lit", label: "Literature Survey", max: 10 },
  { id: "method", label: "Methodology", max: 20 },
  { id: "impl", label: "Implementation", max: 30 },
  { id: "pres", label: "Presentation", max: 10 },
  { id: "team", label: "Teamwork", max: 10 },
  { id: "docs", label: "Documentation", max: 10 },
];

const mockGroups = [
  { id: "G-14", name: "Alpha AI", domain: "Machine Learning", review1: "completed" },
  { id: "G-08", name: "Cyber Shield", domain: "Cybersecurity", review1: "pending" },
  { id: "G-22", name: "Cloud Sync", domain: "Cloud Computing", review1: "pending" },
];

export default function EvaluationSystem() {
  const [selectedGroup, setSelectedGroup] = useState(mockGroups[1].id);
  const [reviewPhase, setReviewPhase] = useState("Review I");
  const [scores, setScores] = useState<Record<string, number>>({
    problem: 8, lit: 7, method: 15, impl: 20, pres: 8, team: 9, docs: 7
  });
  const [remarks, setRemarks] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const activeGroup = mockGroups.find(g => g.id === selectedGroup);

  const handleScoreChange = (id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
    setIsSaved(false);
  };

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((a, b) => a + b, 0);
  }, [scores]);

  const maxTotal = useMemo(() => {
    return criteria.reduce((a, c) => a + c.max, 0);
  }, []);

  const radarData = useMemo(() => {
    return criteria.map(c => ({
      subject: c.label.split(' ')[0], // Shorten label for radar chart
      A: (scores[c.id] / c.max) * 100, // Normalize to 100%
      fullMark: 100,
    }));
  }, [scores]);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rubric-Based Evaluation</h2>
          <p className="text-muted-foreground mt-1 text-lg">Live assessment portal for project reviews.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Sidebar - Groups */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              placeholder="Search groups..." 
              className="w-full pl-9 pr-4 py-2 bg-card border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {mockGroups.map(group => (
              <div 
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  selectedGroup === group.id 
                    ? "bg-indigo-500/10 border-indigo-500/50" 
                    : "bg-card border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-foreground">{group.id}</span>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    group.review1 === 'completed' ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                </div>
                <div className="text-sm font-medium text-muted-foreground">{group.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Evaluation Form */}
        <div className="flex-1 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col overflow-hidden">
          {activeGroup ? (
            <>
              {/* Header Details */}
              <div className="p-6 border-b border-white/5 shrink-0 bg-muted/10 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    {activeGroup.id}: {activeGroup.name}
                  </h3>
                  <p className="text-sm text-indigo-400 font-medium mt-1">{activeGroup.domain}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <select 
                    value={reviewPhase}
                    onChange={(e) => setReviewPhase(e.target.value)}
                    className="px-4 py-2 bg-background border border-white/10 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    <option>Review I</option>
                    <option>Review II</option>
                    <option>Review III</option>
                    <option>Final Assessment</option>
                  </select>
                </div>
              </div>

              {/* Rubric Content */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-8">
                {/* Sliders */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    <ClipboardCheck className="w-4 h-4" /> Grading Rubric
                  </div>
                  
                  {criteria.map((c) => (
                    <div key={c.id} className="space-y-2 p-3 rounded-xl border border-white/5 bg-background/50 hover:bg-background transition-colors">
                      <div className="flex justify-between text-sm font-medium">
                        <label className="text-foreground flex items-center gap-2">
                          {c.label}
                        </label>
                        <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          {scores[c.id]} / {c.max}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={c.max}
                        value={scores[c.id]}
                        onChange={(e) => handleScoreChange(c.id, parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Analytics & Comments */}
                <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
                  <div className="p-6 rounded-xl border border-white/5 bg-background relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[160px]">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Score</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-bold tracking-tighter text-foreground">{totalScore}</span>
                      <span className="text-2xl font-bold text-muted-foreground">/{maxTotal}</span>
                    </div>
                    <div className="mt-3 text-sm font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                      <Award className="w-4 h-4" /> Grade Expected: A
                    </div>
                  </div>

                  <div className="h-[250px] w-full p-4 rounded-xl border border-white/5 bg-background">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 11}} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(val: any) => [`${Number(val).toFixed(0)}%`, 'Performance']} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Overall Remarks
                    </label>
                    <textarea 
                      placeholder="Add final comments for the group..."
                      value={remarks}
                      onChange={e => { setRemarks(e.target.value); setIsSaved(false); }}
                      className="flex-1 min-h-[100px] w-full p-3 rounded-xl border border-white/5 bg-background outline-none focus:border-indigo-500 resize-none text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-white/5 shrink-0 bg-muted/10 flex justify-end gap-3">
                <button className="px-4 py-2 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Discard Changes
                </button>
                <button 
                  onClick={handleSave}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
                    isSaved ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                  )}
                >
                  {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />} 
                  {isSaved ? "Marks Saved" : "Save Evaluation"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a group to begin evaluation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
