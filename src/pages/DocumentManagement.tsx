import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, UploadCloud, FileText, FileCode2, 
  Presentation, Award, CheckCircle2, Clock, 
  AlertTriangle, Eye, Download, Trash2, 
  History, ShieldCheck, MoreVertical, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

type DocStatus = "approved" | "pending" | "rejected" | "under_review";
type DocCategory = "synopsis" | "ppt" | "source_code" | "final_report" | "certificate";

interface DocumentFile {
  id: string;
  name: string;
  category: DocCategory;
  size: string;
  uploadedAt: string;
  version: string;
  status: DocStatus;
  plagiarismScore: number;
  uploader: string;
}

const mockDocuments: DocumentFile[] = [
  {
    id: "d1",
    name: "Synopsis_Group14_v2.pdf",
    category: "synopsis",
    size: "1.2 MB",
    uploadedAt: "Nov 10, 2024",
    version: "v2.0",
    status: "approved",
    plagiarismScore: 8,
    uploader: "Aryan Shah",
  },
  {
    id: "d2",
    name: "Review2_Presentation.pptx",
    category: "ppt",
    size: "8.4 MB",
    uploadedAt: "Nov 11, 2024",
    version: "v1.2",
    status: "under_review",
    plagiarismScore: 3,
    uploader: "Priya Mehta",
  },
  {
    id: "d3",
    name: "ProTrack_SourceCode.zip",
    category: "source_code",
    size: "24.7 MB",
    uploadedAt: "Nov 12, 2024",
    version: "v3.1",
    status: "pending",
    plagiarismScore: 0,
    uploader: "Dev Kapoor",
  },
  {
    id: "d4",
    name: "FinalReport_Draft1.pdf",
    category: "final_report",
    size: "5.8 MB",
    uploadedAt: "Nov 13, 2024",
    version: "v1.0",
    status: "rejected",
    plagiarismScore: 34,
    uploader: "Aryan Shah",
  },
  {
    id: "d5",
    name: "Course_Completion_Certificate.pdf",
    category: "certificate",
    size: "0.3 MB",
    uploadedAt: "Nov 14, 2024",
    version: "v1.0",
    status: "approved",
    plagiarismScore: 0,
    uploader: "Priya Mehta",
  },
];

const categoryConfig: Record<DocCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  synopsis: { label: "Synopsis", icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ppt: { label: "Presentation", icon: Presentation, color: "text-orange-500", bg: "bg-orange-500/10" },
  source_code: { label: "Source Code", icon: FileCode2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  final_report: { label: "Final Report", icon: FolderOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
  certificate: { label: "Certificate", icon: Award, color: "text-amber-500", bg: "bg-amber-500/10" },
};

const statusConfig: Record<DocStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  pending: { label: "Pending", icon: Clock, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  under_review: { label: "Under Review", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  rejected: { label: "Rejected", icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const versionHistory = [
  { version: "v2.0", date: "Nov 10, 2024", note: "Revised methodology section per guide feedback." },
  { version: "v1.1", date: "Nov 5, 2024", note: "Added abstract and keywords." },
  { version: "v1.0", date: "Nov 1, 2024", note: "Initial draft submission." },
];

export default function DocumentManagement() {
  const [docs, setDocs] = useState<DocumentFile[]>(mockDocuments);
  const [activeFilter, setActiveFilter] = useState<DocCategory | "all">("all");
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(mockDocuments[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const filteredDocs = activeFilter === "all" ? docs : docs.filter(d => d.category === activeFilter);

  const stats = {
    total: docs.length,
    approved: docs.filter(d => d.status === "approved").length,
    pending: docs.filter(d => d.status === "pending" || d.status === "under_review").length,
    flagged: docs.filter(d => d.plagiarismScore > 20).length,
  };

  const handleDelete = (id: string) => {
    setDocs(docs.filter(d => d.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <FolderOpen className="w-8 h-8 text-emerald-500" />
            </div>
            Document Management
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">Secure upload, version tracking, and approval workflow.</p>
        </div>
        <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 w-max">
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", val: stats.total, icon: FolderOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Approved", val: stats.approved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Pending Review", val: stats.pending, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Plagiarism Flags", val: stats.flagged, icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((k, i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/5 bg-card shadow-sm relative overflow-hidden hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{k.label}</p>
                <h3 className="text-3xl font-bold">{k.val}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl", k.bg)}>
                <k.icon className={cn("w-5 h-5", k.color)} />
              </div>
            </div>
            <div className={cn("absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20 z-0", k.bg)} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-20rem)] min-h-[500px]">
        
        {/* Left: File Browser */}
        <div className="w-full lg:w-2/5 flex flex-col gap-4">
          
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={() => setIsDragging(false)}
            onDragOver={e => e.preventDefault()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shrink-0",
              isDragging
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-white/10 hover:border-white/20 bg-card hover:bg-white/[0.02]"
            )}
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all", isDragging ? "bg-emerald-500/20" : "bg-white/5 group-hover:bg-white/10")}>
              <UploadCloud className={cn("w-6 h-6 transition-colors", isDragging ? "text-emerald-500" : "text-muted-foreground group-hover:text-foreground")} />
            </div>
            <p className="font-semibold text-sm text-foreground">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, PPTX, ZIP, DOC • Max 50MB per file</p>
          </div>

          {/* Category Filter */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", activeFilter === "all" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5")}
            >
              All
            </button>
            {(Object.keys(categoryConfig) as DocCategory[]).map(cat => {
              const conf = categoryConfig[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                    activeFilter === cat ? `${conf.bg} ${conf.color}` : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <conf.icon className="w-3 h-3" /> {conf.label}
                </button>
              );
            })}
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <AnimatePresence>
              {filteredDocs.map(doc => {
                const catConf = categoryConfig[doc.category];
                const statConf = statusConfig[doc.status];
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <motion.div
                    layout
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => setSelectedDoc(doc)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all group relative",
                      isSelected ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/5 bg-card hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", catConf.bg)}>
                        <catConf.icon className={cn("w-5 h-5", catConf.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate pr-6">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{doc.size}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{doc.version}</span>
                        </div>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0", statConf.bg, statConf.color, statConf.border)}>
                        {statConf.label}
                      </span>
                    </div>

                    {/* Plagiarism bar */}
                    {doc.plagiarismScore > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <ShieldCheck className={cn("w-3 h-3 shrink-0", doc.plagiarismScore > 20 ? "text-rose-500" : "text-emerald-500")} />
                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", doc.plagiarismScore > 20 ? "bg-rose-500" : doc.plagiarismScore > 10 ? "bg-amber-500" : "bg-emerald-500")}
                            style={{ width: `${doc.plagiarismScore}%` }}
                          />
                        </div>
                        <span className={cn("font-bold", doc.plagiarismScore > 20 ? "text-rose-400" : "text-emerald-400")}>
                          {doc.plagiarismScore}%
                        </span>
                      </div>
                    )}

                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Document Preview Panel */}
        <div className="flex-1 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col overflow-hidden">
          {selectedDoc ? (
            <>
              {/* Preview Header */}
              <div className="p-5 border-b border-white/5 shrink-0 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", categoryConfig[selectedDoc.category].bg)}>
                    {(() => { const Ic = categoryConfig[selectedDoc.category].icon; return <Ic className={cn("w-6 h-6", categoryConfig[selectedDoc.category].color)} />; })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-tight">{selectedDoc.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Uploaded by {selectedDoc.uploader} · {selectedDoc.uploadedAt} · {selectedDoc.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setShowHistory(!showHistory)} className={cn("p-2 rounded-lg transition-colors", showHistory ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-white/10 text-muted-foreground")}>
                    <History className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status + Plagiarism */}
              <div className="px-5 py-3 border-b border-white/5 shrink-0 flex flex-wrap gap-3 items-center">
                {(() => {
                  const s = statusConfig[selectedDoc.status];
                  const Ic = s.icon;
                  return (
                    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold", s.bg, s.color, s.border)}>
                      <Ic className="w-4 h-4" /> {s.label}
                    </div>
                  );
                })()}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold",
                  selectedDoc.plagiarismScore > 20 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                  selectedDoc.plagiarismScore > 10 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  <ShieldCheck className="w-4 h-4" />
                  Plagiarism: {selectedDoc.plagiarismScore}%
                  {selectedDoc.plagiarismScore > 20 ? " — Flagged" : " — OK"}
                </div>
                <span className="ml-auto px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-muted-foreground">
                  {selectedDoc.version}
                </span>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Preview Area */}
                <div className="flex-1 flex items-center justify-center p-6 bg-muted/10 relative">
                  <div className="text-center max-w-xs">
                    {(() => { const Ic = categoryConfig[selectedDoc.category].icon; return <Ic className={cn("w-16 h-16 mx-auto mb-4 opacity-20", categoryConfig[selectedDoc.category].color)} />; })()}
                    <h4 className="font-semibold text-foreground">{selectedDoc.name}</h4>
                    <p className="text-sm text-muted-foreground mt-2">Preview not available in this mode.</p>
                    <button className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 mx-auto">
                      <Eye className="w-4 h-4" /> Open Full Preview
                    </button>
                  </div>
                </div>

                {/* Version History Sidebar */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 260, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="border-l border-white/5 bg-card overflow-hidden shrink-0"
                    >
                      <div className="p-4 w-[260px]">
                        <h4 className="font-bold mb-4 flex items-center gap-2 text-sm">
                          <History className="w-4 h-4 text-indigo-500" /> Version History
                        </h4>
                        <div className="space-y-4">
                          {versionHistory.map((v, i) => (
                            <div key={i} className="flex gap-3 relative">
                              <div className="flex flex-col items-center">
                                <div className={cn("w-3 h-3 rounded-full mt-0.5 shrink-0", i === 0 ? "bg-emerald-500" : "bg-white/20")} />
                                {i < versionHistory.length - 1 && <div className="w-0.5 flex-1 bg-white/10 mt-1 mb-0" />}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-400">{v.version}</span>
                                  <span className="text-[10px] text-muted-foreground">{v.date}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{v.note}</p>
                                <button className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-1">Restore</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a document to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
