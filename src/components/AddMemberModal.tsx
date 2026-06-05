import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prnNo: string) => Promise<void>;
    isLoading?: boolean;
    currentMemberCount?: number;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
    currentMemberCount = 1
}) => {
    const [prnNo, setPrnNo] = useState('');
    const [error, setError] = useState('');

    const canAddMore = currentMemberCount < 4;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!prnNo.trim()) {
            setError('PRN number is required');
            return;
        }

        if (!canAddMore) {
            setError('Group has reached maximum 4 members');
            return;
        }

        try {
            await onSubmit(prnNo);
            setPrnNo('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add member');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Add Group Member</h2>
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

                    {!canAddMore && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                            Group has maximum 4 members. Cannot add more.
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Student PRN Number
                        </label>
                        <input
                            type="text"
                            value={prnNo}
                            onChange={(e) => setPrnNo(e.target.value)}
                            placeholder="e.g., PRN001"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={!canAddMore}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Current members: {currentMemberCount}/4
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
                            disabled={isLoading || !canAddMore}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
