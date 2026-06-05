import { useState } from "react";
import { 
  Lightbulb, CheckCircle2, XCircle, Clock, 
  MessageSquare, Sparkles, Send, Tag, Plus
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

// Mock Data
const mockTopics = [
  {
    id: "T-001",
    title: "AI-Powered Academic ERP",
    group: "G-14",
    domain: "Machine Learning",
    description: "A centralized platform utilizing ML algorithms to automate project tracking, faculty allocation, and PO/PSO attainment calculations.",
    techStack: ["React", "Python", "TensorFlow", "Node.js"],
    status: "approved",
    aiConfidence: 94,
    comments: [
      { author: "Dr. Sarah Jenkins", role: "faculty", text: "Excellent scope. Make sure to clearly define your ML model inputs." }
    ]
  },
  {
    id: "T-002",
    title: "Decentralized Credential Verification",
    group: "G-14",
    domain: "Blockchain",
    description: "Using Ethereum smart contracts to issue and verify university degrees instantly to prevent fraud.",
    techStack: ["Solidity", "Next.js", "Web3.js", "IPFS"],
    status: "needs_changes",
    aiConfidence: 88,
    comments: [
      { author: "Dr. Sarah Jenkins", role: "faculty", text: "Too broad. Please specify which consensus mechanism you plan to test locally." }
    ]
  },
  {
    id: "T-003",
    title: "Smart Traffic Flow Predictor",
    group: "G-18",
    domain: "Computer Vision",
    description: "Using real-time CCTV feeds to predict traffic congestion and alter smart traffic light timings dynamically.",
    techStack: ["OpenCV", "YOLOv8", "FastAPI"],
    status: "pending",
    aiConfidence: 91,
    comments: []
  }
];

export default function TopicWorkflow() {
  const { role } = useStore();
  const [topics, setTopics] = useState(mockTopics);
  const [selectedTopic, setSelectedTopic] = useState(mockTopics[0].id);
  
  // Student Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTech, setNewTech] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");

  const activeTopicData = topics.find(t => t.id === selectedTopic);

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTech.trim() && !techStack.includes(newTech.trim())) {
      setTechStack([...techStack, newTech.trim()]);
      setNewTech("");
    }
  };

  const submitTopic = () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    const newTopic = {
      id: `T-00${topics.length + 1}`,
      title: newTitle,
      group: "G-14",
      domain: "AI Detected", // Simulated
      description: newDesc,
      techStack: techStack,
      status: "pending",
      aiConfidence: 85,
      comments: []
    };
    setTopics([...topics, newTopic]);
    setNewTitle(""); setNewDesc(""); setTechStack([]);
    setSelectedTopic(newTopic.id);
  };

  const handleStatusChange = (status: string) => {
    setTopics(topics.map(t => t.id === selectedTopic ? { ...t, status } : t));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = { author: role === 'student' ? 'Student' : 'Faculty Guide', role: role || 'student', text: newComment };
    setTopics(topics.map(t => t.id === selectedTopic ? { ...t, comments: [...t.comments, comment] } : t));
    setNewComment("");
  };

  const filteredTopics = role === 'student' ? topics.filter(t => t.group === "G-14") : topics;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Topic Submission & Approval</h2>
          <p className="text-muted-foreground mt-1 text-lg">Collaborative workspace for project ideas and domains.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Sidebar - Topic List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          {role === 'student' && (
            <div className="p-4 rounded-2xl border border-white/5 bg-card shadow-sm shrink-0">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> Propose New Topic</h3>
              <div className="space-y-3">
                <input 
                  placeholder="Project Title" 
                  value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                <textarea 
                  placeholder="Brief description & objectives..." 
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none h-20"
                />
                <form onSubmit={handleAddTech} className="flex gap-2">
                  <input 
                    placeholder="Add Tech Stack (e.g. React)" 
                    value={newTech} onChange={e => setNewTech(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500"
                  />
                  <button type="submit" className="px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10"><Plus className="w-4 h-4" /></button>
                </form>
                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {techStack.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">{t}</span>
                    ))}
                  </div>
                )}
                <button onClick={submitTopic} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all">
                  Submit Proposal
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredTopics.map(topic => (
              <div 
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  selectedTopic === topic.id 
                    ? "bg-indigo-500/10 border-indigo-500/50" 
                    : "bg-card border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-muted-foreground">{topic.id} {role === 'faculty' && `• ${topic.group}`}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1",
                    topic.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    topic.status === 'needs_changes' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  )}>
                    {topic.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {topic.status === 'needs_changes' && <MessageSquare className="w-3 h-3" />}
                    {topic.status === 'pending' && <Clock className="w-3 h-3" />}
                    {topic.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-foreground line-clamp-1">{topic.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Topic Details & Workflow */}
        <div className="flex-1 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col overflow-hidden relative">
          {activeTopicData ? (
            <>
              {/* Header Details */}
              <div className="p-6 border-b border-white/5 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <Lightbulb className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-foreground">{activeTopicData.title}</h3>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm mb-6">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-indigo-400 font-medium">AI Domain: {activeTopicData.domain}</span>
                    <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded ml-1">{activeTopicData.aiConfidence}% match</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Description & Objectives</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{activeTopicData.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> Proposed Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeTopicData.techStack.map(t => (
                        <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-medium text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Actions (Faculty Only) */}
              {role === 'faculty' && activeTopicData.status === 'pending' && (
                <div className="p-4 bg-muted/20 border-b border-white/5 shrink-0 flex gap-3">
                  <button onClick={() => handleStatusChange('approved')} className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Approve Topic
                  </button>
                  <button onClick={() => handleStatusChange('needs_changes')} className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <MessageSquare className="w-4 h-4" /> Request Changes
                  </button>
                  <button onClick={() => handleStatusChange('rejected')} className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4" /> Discussion Thread
                </h4>
                {activeTopicData.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-8">No comments yet. Start the discussion below.</p>
                ) : (
                  activeTopicData.comments.map((comment, i) => (
                    <div key={i} className={cn("flex gap-3 max-w-[80%]", comment.role === role ? "ml-auto flex-row-reverse" : "")}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                        {comment.author.charAt(0)}
                      </div>
                      <div className={cn("p-3 rounded-2xl text-sm", comment.role === role ? "bg-indigo-600 text-white rounded-tr-none" : "bg-muted border border-white/5 rounded-tl-none text-foreground")}>
                        <div className="text-[10px] font-bold mb-1 opacity-70">{comment.author}</div>
                        {comment.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="p-4 border-t border-white/5 shrink-0 bg-card">
                <div className="flex gap-2 relative">
                  <input 
                    placeholder="Add a comment or feedback..." 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 pl-4 pr-12 py-3 bg-background border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button onClick={handleAddComment} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a topic to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
