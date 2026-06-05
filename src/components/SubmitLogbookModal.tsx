import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SubmitLogbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (weekNumber: number, workSummary: string, evidenceUrl?: string) => Promise<void>;
    isLoading?: boolean;
}

export const SubmitLogbookModal: React.FC<SubmitLogbookModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false
}) => {
    const [weekNumber, setWeekNumber] = useState('');
    const [workSummary, setWorkSummary] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!weekNumber || !workSummary.trim()) {
            setError('Week number and work summary are required');
            return;
        }

        try {
            await onSubmit(
                parseInt(weekNumber),
                workSummary,
                evidenceUrl || undefined
            );
            setWeekNumber('');
            setWorkSummary('');
            setEvidenceUrl('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit logbook');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Submit Logbook Entry</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Week Number
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="52"
                            value={weekNumber}
                            onChange={(e) => setWeekNumber(e.target.value)}
                            placeholder="e.g., 1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Work Summary
                        </label>
                        <textarea
                            value={workSummary}
                            onChange={(e) => setWorkSummary(e.target.value)}
                            placeholder="Describe the work completed this week..."
                            rows={5}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Evidence URL (Optional)
                        </label>
                        <input
                            type="url"
                            value={evidenceUrl}
                            onChange={(e) => setEvidenceUrl(e.target.value)}
                            placeholder="e.g., https://drive.google.com/..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Link to documents, code repository, or demo
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Submitting...' : 'Submit Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
