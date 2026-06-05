import { useState, useEffect } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Users,
  ArrowRight,
  Network,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingGroup {
  group_id: string;
  group_name: string;
  status: string;
  member_count: number;
  created_at: string;
}

interface GuideRecommendation {
  faculty_id: string;
  email: string;
  expertise_tags: string[];
  current_workload: number;
  max_workload: number;
  match_score: number;
}

interface AllocationResult {
  guideName: string;
  groupName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute SVG strokeDashoffset for a circle with circumference ~226 (r=36). */
function scoreOffset(matchScore: number): number {
  const circumference = 226; // 2π × 36 ≈ 226
  return circumference - circumference * matchScore;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIAllocation() {
  const { token } = useAuthStore();

  // Groups state
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PendingGroup | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<GuideRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [domainTags, setDomainTags] = useState<string[]>([]);

  // Allocation state
  const [isAllocating, setIsAllocating] = useState<string | null>(null); // holds guide_id being allocated
  const [allocatedResult, setAllocatedResult] = useState<AllocationResult | null>(null);

  // UI
  const [error, setError] = useState<string | null>(null);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  // ── Fetch pending groups on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    setIsLoadingGroups(true);
    setError(null);
    api
      .getAllocationPending(token)
      .then((data: any) => {
        const groups: PendingGroup[] = data.groups ?? [];
        setPendingGroups(groups);
        if (groups.length > 0) {
          setSelectedGroup(groups[0]);
        }
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load pending groups.");
      })
      .finally(() => setIsLoadingGroups(false));
  }, [token]);

  // ── Fetch recommendations when selected group changes ─────────────────────

  useEffect(() => {
    if (!token || !selectedGroup) {
      setRecommendations([]);
      setDomainTags([]);
      return;
    }
    setIsLoadingRecommendations(true);
    setError(null);
    setAllocatedResult(null);
    api
      .getGuideRecommendations(token, selectedGroup.group_id)
      .then((data: any) => {
        setRecommendations(data.recommendations ?? []);
        setDomainTags(data.domain_tags ?? []);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load recommendations.");
        setRecommendations([]);
        setDomainTags([]);
      })
      .finally(() => setIsLoadingRecommendations(false));
  }, [token, selectedGroup]);

  // ── Allocate handler ───────────────────────────────────────────────────────

  const handleAllocate = async (guide: GuideRecommendation) => {
    if (!token || !selectedGroup) return;
    setIsAllocating(guide.faculty_id);
    setError(null);
    try {
      await api.assignGuideAllocation(token, selectedGroup.group_id, guide.faculty_id);
      setAllocatedResult({
        guideName: guide.email,
        groupName: selectedGroup.group_name,
      });
      // Remove the group from pending list
      setPendingGroups((prev) => prev.filter((g) => g.group_id !== selectedGroup.group_id));
    } catch (err: any) {
      const msg: string = err.message || "";
      if (msg.includes("409") || msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("already")) {
        setError("Conflict: This guide is already at maximum workload or this group already has a guide.");
      } else {
        setError(msg || "Failed to assign guide.");
      }
    } finally {
      setIsAllocating(null);
    }
  };

  // ── Reset: pick another group ──────────────────────────────────────────────

  const handlePickAnother = () => {
    setAllocatedResult(null);
    setError(null);
    if (pendingGroups.length > 0) {
      setSelectedGroup(pendingGroups[0]);
    } else {
      setSelectedGroup(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <BrainCircuit className="w-8 h-8 text-indigo-500" />
            </div>
            Nexus AI Allocation Engine
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Intelligent Project-to-Faculty Matching System.
          </p>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400/60 hover:text-red-400"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Group selector + Group info */}
        <div className="flex flex-col gap-6">
          {/* Group picker */}
          {pendingGroups.length > 1 && (
            <div className="p-4 rounded-2xl border border-white/5 bg-card shadow-sm">
              <button
                className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground"
                onClick={() => setGroupPickerOpen((v) => !v)}
              >
                <span>Switch Group ({pendingGroups.length} pending)</span>
                {groupPickerOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <AnimatePresence>
                {groupPickerOpen && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-1 overflow-hidden"
                  >
                    {pendingGroups.map((g) => (
                      <li key={g.group_id}>
                        <button
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedGroup?.group_id === g.group_id
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "hover:bg-white/5 text-foreground"
                          }`}
                          onClick={() => {
                            setSelectedGroup(g);
                            setGroupPickerOpen(false);
                          }}
                        >
                          {g.group_name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({g.member_count} members)
                          </span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Group card */}
          {isLoadingGroups ? (
            <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm flex items-center justify-center min-h-[160px]">
              <div className="text-muted-foreground text-sm">Loading groups…</div>
            </div>
          ) : selectedGroup ? (
            <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Target Group
              </h3>
              <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm">
                <h4 className="text-2xl font-bold text-foreground">{selectedGroup.group_name}</h4>
                <p className="text-indigo-400 font-medium mb-4">
                  {domainTags.length > 0 ? domainTags.join(" & ") : "No domain tags"}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" /> Size
                    </span>
                    <span className="font-medium">{selectedGroup.member_count} Members</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Network className="w-4 h-4" /> Status
                    </span>
                    <span className="font-medium text-amber-500">{selectedGroup.status}</span>
                  </div>
                </div>
              </div>

              {/* Domain tags */}
              {domainTags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {domainTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-muted-foreground border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm flex items-center justify-center min-h-[160px]">
              <p className="text-muted-foreground text-sm text-center">
                All groups have been allocated. ✓
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: AI Recommendations */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-card shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> AI Recommended Faculty
            </h3>
            {!allocatedResult && !isLoadingRecommendations && recommendations.length > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                {recommendations.length} Match{recommendations.length !== 1 ? "es" : ""} Found
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            <AnimatePresence mode="wait">
              {/* Loading state */}
              {isLoadingRecommendations ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-2 rounded-full border-b-2 border-l-2 border-purple-500"
                    />
                    <BrainCircuit className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    Running Matching Algorithm...
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Analyzing workload, expertise, and domain overlap.
                  </p>
                </motion.div>
              ) : allocatedResult ? (
                /* Success state */
                <motion.div
                  key="allocated"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-50" />
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Allocation Complete</h3>
                  <p className="text-muted-foreground mt-2 text-center max-w-md">
                    Group{" "}
                    <strong className="text-foreground">{allocatedResult.groupName}</strong> has been
                    officially assigned to{" "}
                    <strong className="text-foreground">{allocatedResult.guideName}</strong>.
                    Notifications have been dispatched.
                  </p>
                  <button
                    onClick={handlePickAnother}
                    className="mt-8 px-6 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Allocate Another Group
                  </button>
                </motion.div>
              ) : !selectedGroup ? (
                /* No pending groups */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-muted-foreground"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-4" />
                  <p className="text-lg font-medium">All groups have been allocated.</p>
                  <p className="text-sm mt-1">No pending assignments remain.</p>
                </motion.div>
              ) : recommendations.length === 0 ? (
                /* No recommendations (guides at max workload, etc.) */
                <motion.div
                  key="no-recommendations"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-muted-foreground"
                >
                  <AlertCircle className="w-10 h-10 text-amber-500/60 mb-4" />
                  <p className="font-medium">No available guides found.</p>
                  <p className="text-sm mt-1">All guides may be at maximum workload.</p>
                </motion.div>
              ) : (
                /* Recommendations list */
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {recommendations.map((guide, index) => {
                    const scorePercent = Math.round(guide.match_score * 100);
                    const dashOffset = scoreOffset(guide.match_score);
                    const isTop = index === 0;
                    const isBeingAllocated = isAllocating === guide.faculty_id;

                    return (
                      <motion.div
                        key={guide.faculty_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-5 rounded-xl border relative overflow-hidden ${
                          isTop
                            ? "border-indigo-500/30 bg-indigo-500/5"
                            : "border-white/10 bg-white/5 opacity-80 hover:opacity-100 transition-opacity"
                        }`}
                      >
                        {isTop && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        )}
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {/* Score Ring */}
                          <div className="relative shrink-0">
                            <svg
                              className={`transform -rotate-90 ${isTop ? "w-20 h-20" : "w-16 h-16"}`}
                            >
                              <circle
                                cx={isTop ? 40 : 32}
                                cy={isTop ? 40 : 32}
                                r={isTop ? 36 : 28}
                                stroke="currentColor"
                                strokeWidth={isTop ? 6 : 4}
                                fill="transparent"
                                className="text-white/5"
                              />
                              <circle
                                cx={isTop ? 40 : 32}
                                cy={isTop ? 40 : 32}
                                r={isTop ? 36 : 28}
                                stroke="currentColor"
                                strokeWidth={isTop ? 6 : 4}
                                fill="transparent"
                                strokeDasharray={isTop ? 226 : 175}
                                strokeDashoffset={
                                  isTop
                                    ? dashOffset
                                    : 175 - 175 * guide.match_score
                                }
                                className={isTop ? "text-indigo-500" : "text-emerald-500"}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span
                                className={`font-bold text-foreground leading-none ${
                                  isTop ? "text-xl" : "text-lg"
                                }`}
                              >
                                {scorePercent}
                                {isTop && (
                                  <span className="text-xs text-muted-foreground">%</span>
                                )}
                                {!isTop && (
                                  <span className="text-xs text-muted-foreground">%</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 text-center md:text-left">
                            <h4
                              className={`font-bold flex flex-wrap items-center justify-center md:justify-start gap-3 ${
                                isTop ? "text-xl" : "text-lg"
                              }`}
                            >
                              {guide.email}
                              {isTop && (
                                <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20">
                                  Best Match
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {guide.current_workload}/{guide.max_workload} Active Groups
                            </p>
                            {isTop && guide.expertise_tags.length > 0 && (
                              <div className="text-xs bg-black/20 border border-white/5 px-3 py-2 rounded-lg inline-flex items-center gap-2 text-slate-300">
                                <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                                Expertise: {guide.expertise_tags.slice(0, 4).join(", ")}
                              </div>
                            )}
                          </div>

                          {/* Allocate button */}
                          <button
                            onClick={() => handleAllocate(guide)}
                            disabled={isAllocating !== null}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 w-full md:w-auto justify-center ${
                              isTop
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60"
                                : "border border-white/10 hover:bg-white/10 disabled:opacity-40"
                            }`}
                          >
                            {isBeingAllocated ? (
                              <>
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="inline-block"
                                >
                                  ⏳
                                </motion.span>
                                Allocating…
                              </>
                            ) : isTop ? (
                              <>
                                Allocate <ArrowRight className="w-4 h-4" />
                              </>
                            ) : (
                              "Select"
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
