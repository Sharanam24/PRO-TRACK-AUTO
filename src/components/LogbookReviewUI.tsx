import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Logbook {
    log_id: string;
    group_id: string;
    week_number: number;
    work_summary: string;
    guide_status: string;
    created_at: string;
}

interface LogbookReviewUIProps {
    token: string;
    groupId: string;
}

export const LogbookReviewUI: React.FC<LogbookReviewUIProps> = ({ token, groupId }) => {
    const [logbooks, setLogbooks] = useState<Logbook[]>([]);
    const [selectedLogbookId, setSelectedLogbookId] = useState<string | null>(null);
    const [remarks, setRemarks] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchLogbooks = async () => {
        try {
            setIsLoading(true);
            const data = await api.getLogbooks(token, groupId, 'PENDING');
            setLogbooks(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load logbooks');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogbooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    const handleApprove = async (logbookId: string) => {
        try {
            setIsLoading(true);
            await api.approveLogbook(token, logbookId, 'APPROVED', remarks);
            setSuccess('Logbook approved!');
            setTimeout(() => setSuccess(''), 3000);
            setSelectedLogbookId(null);
            setRemarks('');
            await fetchLogbooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve logbook');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (logbookId: string) => {
        try {
            setIsLoading(true);
            await api.approveLogbook(token, logbookId, 'NEEDS_REVISION', remarks);
            setSuccess('Logbook marked for revision!');
            setTimeout(() => setSuccess(''), 3000);
            setSelectedLogbookId(null);
            setRemarks('');
            await fetchLogbooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update logbook');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedLogbook = logbooks.find(l => l.log_id === selectedLogbookId);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Pending Logbook Reviews</h2>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logbooks List */}
                <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                        Pending ({logbooks.length})
                    </h3>
                    {isLoading && logbooks.length === 0 ? (
                        <p className="text-gray-500 text-sm">Loading logbooks...</p>
                    ) : logbooks.length === 0 ? (
                        <p className="text-gray-500 text-sm">No pending logbooks to review</p>
                    ) : (
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
                            {logbooks.map((logbook) => (
                                <button
                                    key={logbook.log_id}
                                    onClick={() => setSelectedLogbookId(logbook.log_id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        selectedLogbookId === logbook.log_id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <p className="font-medium text-gray-900">Week {logbook.week_number}</p>
                                    <p className="text-xs text-gray-600 line-clamp-2">{logbook.work_summary}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Review Form */}
                {selectedLogbook && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="font-medium text-gray-900 mb-3">Review Logbook</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600">Week</p>
                                <p className="font-semibold text-gray-900">{selectedLogbook.week_number}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">Work Summary</p>
                                <p className="text-sm text-gray-900 mt-1 p-2 bg-white rounded border border-gray-200 max-h-32 overflow-y-auto">
                                    {selectedLogbook.work_summary}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Provide feedback for the student..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleApprove(selectedLogbook.log_id)}
                                    disabled={isLoading}
                                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    ✓ Approve
                                </button>
                                <button
                                    onClick={() => handleReject(selectedLogbook.log_id)}
                                    disabled={isLoading}
                                    className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    ↻ Needs Revision
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
