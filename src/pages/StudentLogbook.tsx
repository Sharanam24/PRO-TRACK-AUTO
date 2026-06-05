import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, UploadCloud, Plus, CheckCircle2, 
  MessageSquare, Clock, Calendar, Check, X,
  AlignLeft, Bold, Italic, List, Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for previous logbooks
const previousLogs = [
  {
    week: 7,
    date: "Oct 24, 2024",
    status: "approved",
    tasks: ["Completed Database Schema", "Setup Prisma ORM", "Auth endpoints"],
    remarks: "Good progress. Ensure you add unit tests for the auth endpoints.",
  },
  {
    week: 6,
    date: "Oct 17, 2024",
    status: "approved",
    tasks: ["Initial project setup", "Figma design completion", "Frontend routing"],
    remarks: "Designs look great. Proceed with the development phase.",
  },
  {
    week: 5,
    date: "Oct 10, 2024",
    status: "needs_revision",
    tasks: ["Requirements gathering", "Feasibility study"],
    remarks: "Please expand on the feasibility study regarding the ML model choice.",
  }
];

export default function StudentLogbook() {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [tasks, setTasks] = useState<{id: number, text: string, done: boolean}[]>([
    { id: 1, text: "Implement User Dashboard UI", done: true },
    { id: 2, text: "Connect to Firebase backend", done: false },
  ]);
  const [newTask, setNewTask] = useState("");
  const [content, setContent] = useState("");

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
    setNewTask("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Digital Logbook</h2>
          <p className="text-muted-foreground mt-1 text-lg">Submit your weekly progress and receive guide feedback.</p>
        </div>
        <div className="flex p-1 bg-card border border-white/5 rounded-xl shadow-sm w-max">
          <button 
            onClick={() => setActiveTab('new')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'new' ? "bg-indigo-500/10 text-indigo-500" : "hover:bg-white/5 text-muted-foreground")}
          >
            New Submission
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'history' ? "bg-indigo-500/10 text-indigo-500" : "hover:bg-white/5 text-muted-foreground")}
          >
            Log History
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'new' ? (
          <motion.div 
            key="new"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Week 8 Progress</h3>
                  <div className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Due in 2 days
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <label className="text-sm font-semibold text-foreground">Detailed Summary</label>
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-background focus-within:ring-2 ring-indigo-500/50 transition-all">
                    {/* Fake Toolbar */}
                    <div className="flex items-center gap-1 border-b border-white/10 p-2 bg-muted/30">
                      {[Bold, Italic, AlignLeft, List, LinkIcon].map((Icon, i) => (
                        <button key={i} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors">
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Describe the work completed this week..."
                      className="w-full min-h-[200px] p-4 bg-transparent outline-none resize-y text-sm leading-relaxed"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-foreground">Task Checklist</label>
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-muted/20 group hover:bg-muted/40 transition-colors">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={cn("w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors", task.done ? "bg-indigo-500 border-indigo-500" : "border-white/20")}
                        >
                          {task.done && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={cn("text-sm transition-all", task.done ? "text-muted-foreground line-through" : "text-foreground")}>
                          {task.text}
                        </span>
                        <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={addTask} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add a new task..."
                      value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-background text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button type="submit" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Sidebar Tools */}
            <div className="space-y-6">
              {/* File Upload Zone */}
              <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
                <h3 className="text-lg font-bold mb-4">Attachments</h3>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-sm font-medium mb-1">Drag & drop files here</p>
                  <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>

              {/* Next Week Goals */}
              <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
                <h3 className="text-lg font-bold mb-4">Next Week Goals</h3>
                <textarea 
                  placeholder="What will you work on next week?"
                  className="w-full min-h-[100px] p-3 rounded-xl border border-white/10 bg-background text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all">
                <FileText className="w-5 h-5" /> Submit Logbook
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {previousLogs.map((log) => (
              <div key={log.week} className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                <div className="md:w-48 shrink-0 flex flex-col items-start">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Week {log.week}</div>
                  <div className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" /> {log.date}
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border",
                    log.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  )}>
                    {log.status === 'approved' ? 'Approved' : 'Needs Revision'}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Tasks Completed
                    </h4>
                    <ul className="space-y-1">
                      {log.tasks.map((t, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500/50 shrink-0" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Guide's Remarks
                    </h4>
                    <p className="text-sm text-muted-foreground">{log.remarks}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
