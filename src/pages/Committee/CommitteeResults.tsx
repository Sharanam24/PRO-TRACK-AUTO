import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { BarChart2, Search, Trophy, Medal, Star, Download, Loader2 } from 'lucide-react';
import { generateGroupMarksheet, type EvaluationData, type FinalResult } from '../../lib/pdfService';

interface Group {
    group_id: string;
    group_name: string;
}

interface Evaluation {
    eval_id: string;
    group_id: string;
    phase: string;
    total_marks: number;
    created_at: string;
    rubric_scores: Record<string, number>;
}

interface ResultRow extends Evaluation {
    group_name: string;
}

export const CommitteeResults: React.FC = () => {
    const { token } = useAuthStore();
    const [results, setResults] = useState<ResultRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingGroupId, setDownloadingGroupId] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (!token) return;
            try {
                setIsLoading(true);
                const [groups, evaluations] = await Promise.all([
                    api.getGroups(token),
                    api.getEvaluations(token)
                ]);

                const groupMap = new Map(groups.map((g: Group) => [g.group_id, g.group_name]));
                
                const finalEvals = evaluations
                    .filter((e: Evaluation) => e.phase === 'FINAL')
                    .map((e: Evaluation) => ({
                        ...e,
                        group_name: groupMap.get(e.group_id) || 'Unknown Group'
                    }))
                    .sort((a, b) => b.total_marks - a.total_marks); // Sort descending

                setResults(finalEvals);
            } catch (error) {
                console.error("Failed to fetch results", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, [token]);

    const filteredResults = results.filter(r => 
        r.group_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy size={18} className="text-yellow-400" />;
        if (index === 1) return <Medal size={18} className="text-gray-300" />;
        if (index === 2) return <Medal size={18} className="text-amber-600" />;
        return <span className="text-white/30 font-bold text-sm w-[18px] text-center">{index + 1}</span>;
    };

    const handleDownloadPDF = async (result: ResultRow) => {
        if (!token) return;
        try {
            setDownloadingGroupId(result.group_id);

            // Fetch group members and final results in parallel
            const [members, finalResult, evaluations] = await Promise.all([
                api.getMembers(token, result.group_id).catch(() => []),
                api.getEvaluationResults(token, result.group_id).catch(() => null),
                api.getEvaluations(token, result.group_id).catch(() => []),
            ]);

            const groupData = {
                group_id: result.group_id,
                group_name: result.group_name,
                members: Array.isArray(members)
                    ? members.map((m: any) => ({ name: m.email ?? m.name ?? '', prn: m.prn_no ?? m.prn ?? '' }))
                    : [],
            };

            const evalData: EvaluationData[] = Array.isArray(evaluations)
                ? evaluations.map((e: any) => ({
                    phase: e.phase,
                    total_marks: e.total_marks,
                    rubric_scores: e.rubric_scores,
                    evaluated_at: e.created_at,
                    remarks: e.remarks,
                }))
                : [];

            const finalResultData: FinalResult | null = finalResult
                ? {
                    final_marks: finalResult.final_marks ?? 0,
                    grade: finalResult.grade ?? '',
                    r1_marks: finalResult.r1_marks ?? null,
                    r2_marks: finalResult.r2_marks ?? null,
                    r3_marks: finalResult.r3_marks ?? null,
                    final_phase_marks: finalResult.final_phase_marks ?? null,
                    computed_at: finalResult.computed_at ?? '',
                }
                : null;

            generateGroupMarksheet(groupData, evalData, finalResultData);
        } catch (error) {
            console.error('Failed to generate group marksheet', error);
        } finally {
            setDownloadingGroupId(null);
        }
    };

    return (
        <AppShell currentPage="/committee/results">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
                            <BarChart2 size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Final Results</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Leaderboard of evaluated project groups</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl text-sm focus:outline-none focus:border-amber-500/50 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => filteredResults.length > 0 && handleDownloadPDF(filteredResults[0])}
                        disabled={filteredResults.length === 0 || !!downloadingGroupId}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        <Download size={16} /> <span className="hidden sm:inline">Export PDF</span>
                    </button>
                </div>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest w-16 text-center">Rank</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest">Group Name</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-right">Score (/100)</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-right">Date Evaluated</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-center">Marksheet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/30 text-sm">
                                        Loading results...
                                    </td>
                                </tr>
                            ) : filteredResults.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/30 text-sm">
                                        {searchTerm ? 'No groups match your search.' : 'No evaluations completed yet.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredResults.map((result, index) => (
                                    <tr 
                                        key={result.eval_id} 
                                        className={`border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors ${
                                            index === 0 ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.05]' : ''
                                        }`}
                                    >
                                        <td className="p-4 flex justify-center">
                                            {getRankIcon(index)}
                                        </td>
                                        <td className="p-4">
                                            <p className={`text-sm font-semibold ${index === 0 ? 'text-amber-400' : 'text-white'}`}>
                                                {result.group_name}
                                                {index === 0 && <Star size={12} className="inline ml-2 text-amber-400 fill-amber-400" />}
                                            </p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${
                                                parseFloat(result.total_marks.toString()) >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                parseFloat(result.total_marks.toString()) >= 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-white/5 text-white/70 border-white/10'
                                            }`}>
                                                {result.total_marks}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-xs text-white/40">
                                            {new Date(result.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDownloadPDF(result)}
                                                disabled={downloadingGroupId === result.group_id}
                                                title="Download Group Marksheet PDF"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
                                            >
                                                {downloadingGroupId === result.group_id
                                                    ? <Loader2 size={13} className="animate-spin" />
                                                    : <Download size={13} />}
                                                <span className="hidden sm:inline">PDF</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppShell>
    );
};
