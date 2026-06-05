const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

async function apiCall<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { token, ...fetchOptions } = options;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((fetchOptions.headers as Record<string, string>) || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Auth endpoints
    login: (email: string, password: string) =>
        apiCall<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),

    register: (data: {
        email: string;
        password: string;
        role: string;
        prn_no?: string;
        roll_no?: string;
        batch_year?: number;
        expertise_tags?: string[];
    }) =>
        apiCall<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    claimAccount: (data: {
        role: string;
        email: string;
        password: string;
        prn_no?: string;
        employee_id?: string;
    }) =>
        apiCall<any>('/auth/claim-account', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    // Coordinator endpoints
    uploadWhitelist: (token: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${API_BASE}/coordinator/whitelist/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
        });
    },

    getWhitelist: (token: string) =>
        apiCall<any[]>('/coordinator/whitelist', { token, method: 'GET' }),

    // Group endpoints
    getGroups: (token: string, status?: string) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        return apiCall<any[]>(`/groups${params.toString() ? '?' + params : ''}`, {
            token,
            method: 'GET'
        });
    },

    getGroupById: (token: string, groupId: string) =>
        apiCall<any>(`/groups/${groupId}`, { token, method: 'GET' }),

    createGroup: (token: string, groupName: string) =>
        apiCall<any>('/groups', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_name: groupName })
        }),

    updateGroupStatus: (token: string, groupId: string, status: string) =>
        apiCall<any>(`/groups/${groupId}/status`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    // Member endpoints
    addMember: (token: string, groupId: string, prnNo: string) =>
        apiCall<any>(`/groups/${groupId}/members`, {
            token,
            method: 'POST',
            body: JSON.stringify({ prn_no: prnNo })
        }),

    getMembers: (token: string, groupId: string) =>
        apiCall<any>(`/groups/${groupId}/members`, { token, method: 'GET' }),

    removeMember: (token: string, groupId: string, studentId: string) =>
        apiCall<any>(`/groups/${groupId}/members/${studentId}`, {
            token,
            method: 'DELETE'
        }),

    // Proposal endpoints


    submitProposal: (token: string, groupId: string, title: string, tags: string[]) =>
        apiCall<any>(`/groups/${groupId}/proposals`, {
            token,
            method: 'POST',
            body: JSON.stringify({ title, domain_tags: tags })
        }),

    getProposals: (token: string, groupId: string) =>
        apiCall<any>(`/groups/${groupId}/proposals`, { token, method: 'GET' }),

    approveProposal: (token: string, proposalId: string, isApproved: boolean) =>
        apiCall<any>(`/groups/proposals/${proposalId}/approve`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({ is_approved: isApproved })
        }),

    // Logbook endpoints
    uploadEvidence: (token: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
        });
    },

    submitLogbook: (
        token: string,
        groupId: string,
        weekNumber: number,
        workSummary: string,
        evidenceUrl?: string
    ) =>
        apiCall<any>(`/groups/${groupId}/logbooks`, {
            token,
            method: 'POST',
            body: JSON.stringify({
                week_number: weekNumber,
                work_summary: workSummary,
                evidence_url: evidenceUrl
            })
        }),

    getLogbooks: (token: string, groupId: string, status?: string) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        return apiCall<any[]>(
            `/groups/${groupId}/logbooks${params.toString() ? '?' + params : ''}`,
            { token, method: 'GET' }
        );
    },

    approveLogbook: (token: string, logId: string, guideStatus: string, remarks?: string) =>
        apiCall<any>(`/groups/logbooks/${logId}`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({
                guide_status: guideStatus,
                guide_remarks: remarks
            })
        }),

    // Allocation endpoints
    getPendingAllocation: (token: string) =>
        apiCall<any>('/groups/allocation/pending', { token, method: 'GET' }),

    getAvailableGuides: (token: string) =>
        apiCall<any>('/groups/allocation/guides', { token, method: 'GET' }),

    assignGuide: (token: string, groupId: string, guideId: string) =>
        apiCall<any>('/groups/allocation/assign', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, guide_id: guideId })
        }),

    // Evaluation endpoints
    submitEvaluation: (
        token: string,
        groupId: string,
        phase: string,
        rubricScores: Record<string, number>,
        totalMarks: number
    ) =>
        apiCall<any>('/evaluations', {
            token,
            method: 'POST',
            body: JSON.stringify({
                group_id: groupId,
                phase,
                rubric_scores: rubricScores,
                total_marks: totalMarks
            })
        }),

    getEvaluations: (token: string, groupId?: string) => {
        const params = new URLSearchParams();
        if (groupId) params.append('group_id', groupId);
        return apiCall<any[]>(
            `/evaluations${params.toString() ? '?' + params : ''}`,
            { token, method: 'GET' }
        );
    },

    getEvaluationResults: (token: string, groupId: string) =>
        apiCall<any>(`/evaluations/results/${groupId}`, { token, method: 'GET' }),

    // Schedule endpoints
    createSchedule: (token: string, groupId: string, phase: string, presentationTime: string, venue: string) =>
        apiCall<any>('/schedules', {
            token,
            method: 'POST',
            body: JSON.stringify({
                group_id: groupId,
                phase,
                presentation_time: presentationTime,
                venue
            })
        }),
        
    getSchedules: (token: string) =>
        apiCall<any[]>('/schedules', { token, method: 'GET' }),

    getSmartSlots: (token: string) =>
        apiCall<any>('/schedules/smart-slots', { token, method: 'GET' }),

    // Tasks endpoints
    getTasks: (token: string, groupId: string) =>
        apiCall<any[]>(`/tasks/${groupId}`, { token, method: 'GET' }),

    createTask: (token: string, groupId: string, title: string, assignedTo?: string) =>
        apiCall<any>('/tasks', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, title, assigned_to: assignedTo })
        }),

    updateTaskStatus: (token: string, taskId: string, status: string) =>
        apiCall<any>(`/tasks/${taskId}/status`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    // Resources & Notes (Student)
    getGroupResources: (token: string, groupId: string) =>
        apiCall<any[]>(`/resources/${groupId}`, { token, method: 'GET' }),
        
    createResource: (token: string, groupId: string, title: string, url: string) =>
        apiCall<any>('/resources', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, title, url })
        }),
        
    getNote: (token: string) =>
        apiCall<any>('/notes', { token, method: 'GET' }),
        
    saveNote: (token: string, content: string) =>
        apiCall<any>('/notes', {
            token,
            method: 'POST',
            body: JSON.stringify({ content })
        }),

    // Guide Analytics & Bulk Approve
    getGuideAnalytics: (token: string) =>
        apiCall<any[]>('/analytics/guide', { token, method: 'GET' }),
        
    bulkApproveLogbooks: (token: string, logbookIds: string[]) =>
        apiCall<any>('/groups/logbooks/bulk-approve', {
            token,
            method: 'PATCH',
            body: JSON.stringify({ logbook_ids: logbookIds })
        }),
        
    checkPlagiarism: (token: string, proposalId: string) =>
        apiCall<any>(`/groups/proposals/${proposalId}/plagiarism`, {
            token,
            method: 'PATCH'
        }),

    // Coordinator Features
    getOrphanStudents: (token: string) =>
        apiCall<any[]>('/coordinator/action/orphans', { token, method: 'GET' }),
        
    autoGroupOrphans: (token: string) =>
        apiCall<any>('/coordinator/action/auto-group', {
            token,
            method: 'POST'
        }),
        
    getRubrics: (token: string) =>
        apiCall<any[]>('/rubrics', { token, method: 'GET' }),
        
    saveRubric: (token: string, name: string, schema: any) =>
        apiCall<any>('/rubrics', {
            token,
            method: 'POST',
            body: JSON.stringify({ name, schema })
        }),

    // Committee Features
    searchHistoricProjects: (token: string, title: string) =>
        apiCall<any[]>(`/committee/historic-projects?title=${encodeURIComponent(title)}`, { token, method: 'GET' }),

    deleteTask: (token: string, taskId: string) =>
        apiCall<any>(`/tasks/${taskId}`, { token, method: 'DELETE' }),

    // Peer Evaluation endpoints
    submitPeerEvaluation: (token: string, groupId: string, evaluateeId: string, score: number, comments: string) =>
        apiCall<any>('/peer-evaluations', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, evaluatee_id: evaluateeId, score, comments })
        }),

    getGroupPeerEvaluations: (token: string, groupId: string) =>
        apiCall<any[]>(`/peer-evaluations/group/${groupId}`, { token, method: 'GET' }),

    // Chat endpoints
    getGroupChat: (token: string, groupId: string) =>
        apiCall<any[]>(`/chat/group/${groupId}`, { token, method: 'GET' }),

    sendGroupMessage: (token: string, groupId: string, content: string) =>
        apiCall<any>(`/chat/group/${groupId}`, {
            token,
            method: 'POST',
            body: JSON.stringify({ content })
        }),

    getAnnouncements: (token: string) =>
        apiCall<any[]>('/chat/announcements', { token, method: 'GET' }),

    sendAnnouncement: (token: string, content: string) =>
        apiCall<any>('/chat/announcements', {
            token,
            method: 'POST',
            body: JSON.stringify({ content })
        }),

    // --- Cron Tasks (Coordinator Only) ---
    triggerReminders: (token: string) =>
        apiCall<any>('/coordinator/trigger-reminders', {
            token,
            method: 'POST'
        }),

    // Allocation engine (AI-powered)
    getAllocationPending: (token: string) =>
        apiCall<any>('/allocations/pending', { token, method: 'GET' }),

    getGuideRecommendations: (token: string, groupId: string) =>
        apiCall<any>(`/allocations/recommend/${groupId}`, { token, method: 'GET' }),

    assignGuideAllocation: (token: string, groupId: string, guideId: string) =>
        apiCall<any>('/allocations/assign', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, guide_id: guideId })
        }),

    // Settings
    getSettings: async (token: string) => {
        const res = await fetch(`${API_BASE}/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    },

    updateSettings: async (token: string, key: string, value: any) => {
        const res = await fetch(`${API_BASE}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ key, value })
        });
        if (!res.ok) throw new Error('Failed to update settings');
        return res.json();
    }
};
