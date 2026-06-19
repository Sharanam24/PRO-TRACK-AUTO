import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Group {
    group_id: string;
    group_name: string;
    member_count: number;
    status: string;
}

interface Guide {
    faculty_id: string;
    email: string;
    expertise_tags: string[];
    current_workload: number;
    max_workload: number;
}

interface AllocateGuideInterfaceProps {
    token: string;
    onAllocationComplete?: () => void;
}

export const AllocateGuideInterface: React.FC<AllocateGuideInterfaceProps> = ({
    token,
    onAllocationComplete
}) => {
    const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
    const [availableGuides, setAvailableGuides] = useState<Guide[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [groupsData, guidesData] = await Promise.all([
                api.getPendingAllocation(token),
                api.getAvailableGuides(token)
            ]);
            setPendingGroups(Array.isArray(groupsData) ? groupsData as any[] : []);
            setAvailableGuides(Array.isArray(guidesData) ? guidesData : []);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load allocation data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAllocate = async () => {
        if (!selectedGroupId || !selectedGuideId) {
            setError('Please select both a group and a guide');
            return;
        }

        try {
            setIsLoading(true);
            await api.assignGuide(token, selectedGroupId, selectedGuideId);
            setSuccess('Guide allocated successfully!');
            setTimeout(() => setSuccess(''), 3000);
            
            // Refresh data
            await fetchData();
            setSelectedGroupId(null);
            setSelectedGuideId(null);
            
            onAllocationComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to allocate guide');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Guide Allocation System</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3">
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Pending Groups */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Groups Awaiting Allocation ({pendingGroups.length})
                    </label>
                    {isLoading && pendingGroups.length === 0 ? (
                        <p className="text-gray-500 text-sm">Loading groups...</p>
                    ) : pendingGroups.length === 0 ? (
                        <p className="text-gray-500 text-sm">No groups awaiting allocation</p>
                    ) : (
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                            {pendingGroups.map((group) => (
                                <button
                                    key={group.group_id}
                                    onClick={() => setSelectedGroupId(group.group_id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        selectedGroupId === group.group_id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <p className="font-medium text-gray-900">{group.group_name}</p>
                                    <p className="text-xs text-gray-600">{group.member_count}/4 members</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Guides */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Guides ({availableGuides.length})
                    </label>
                    {isLoading && availableGuides.length === 0 ? (
                        <p className="text-gray-500 text-sm">Loading guides...</p>
                    ) : availableGuides.length === 0 ? (
                        <p className="text-gray-500 text-sm">No available guides (all at max capacity)</p>
                    ) : (
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                            {availableGuides.map((guide) => (
                                <button
                                    key={guide.faculty_id}
                                    onClick={() => setSelectedGuideId(guide.faculty_id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        selectedGuideId === guide.faculty_id
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <p className="font-medium text-gray-900">{guide.email}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                                        <span>Workload: {guide.current_workload}/{guide.max_workload}</span>
                                        <span className="inline-block px-2 py-1 bg-gray-100 rounded">
                                            {guide.expertise_tags.length} expertise
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Summary */}
            {(selectedGroupId || selectedGuideId) && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                        {selectedGroupId && (
                            <>
                                <strong>Group:</strong> {pendingGroups.find(g => g.group_id === selectedGroupId)?.group_name}
                                {selectedGuideId && ' → '}
                            </>
                        )}
                        {selectedGuideId && (
                            <>
                                <strong>Guide:</strong> {availableGuides.find(g => g.faculty_id === selectedGuideId)?.email}
                            </>
                        )}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleAllocate}
                    disabled={!selectedGroupId || !selectedGuideId || isLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isLoading ? 'Allocating...' : 'Allocate Guide'}
                </button>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Refresh
                </button>
            </div>
        </div>
    );
};
