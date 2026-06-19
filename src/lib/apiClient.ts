// ─── Environment-aware API base ──────────────────────────────────────────────
// In development, Vite proxies /api to the backend (see vite.config.ts).
// In production, use the full URL from VITE_API_URL env var.
// This ensures consistent behavior in both environments.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Response Type Interfaces ────────────────────────────────────────────────

export interface AuthResponse {
    user_id: string;
    email: string;
    role: 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';
    prn_no?: string | null;
    roll_no?: string | null;
    batch_year?: number | null;
    token: string;
    refresh_token?: string;
}

export interface UserProfile {
    user_id: string;
    email: string;
    role: 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';
    prn_no?: string | null;
    roll_no?: string | null;
    batch_year?: number | null;
    expertise_tags?: string[];
    current_workload?: number;
    max_workload?: number;
}

export interface WhitelistEntry {
    id: string;
    prn_no: string;
    email: string;
    full_name: string;
    is_claimed: boolean;
    created_at: string;
}

export interface WhitelistUploadResult {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
}

export interface ProjectGroup {
    group_id: string;
    group_name: string;
    guide_id: string | null;
    status: 'FORMING' | 'WAITING_ALLOCATION' | 'ACTIVE';
    created_at: string;
    updated_at: string;
    member_count: number;
    guide_email?: string;
    risk_level?: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';}

export interface GroupDetail extends ProjectGroup {
    members: GroupMember[];
    proposals: Proposal[];
}

export interface GroupMember {
    student_id: string;
    email: string;
    prn_no: string;
    is_leader: boolean;
    created_at: string;
}

export interface MemberAddResult {
    message: string;
    member: GroupMember;
}

export interface Proposal {
    proposal_id: string;
    group_id: string;
    title: string;
    domain_tags: string[];
    is_approved: boolean;
    plagiarism_score: number | null;
    created_at: string;
    updated_at: string;
}

export interface UploadResult {
    url: string;
    filename?: string;
}

export interface Logbook {
    log_id: string;
    group_id: string;
    week_number: number;
    work_summary: string;
    evidence_url?: string;
    guide_status: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION';
    guide_remarks?: string;
    created_at: string;
    updated_at: string;
}

export interface Evaluation {
    eval_id: string;
    group_id: string;
    phase: 'REVIEW_1' | 'REVIEW_2' | 'REVIEW_3' | 'FINAL';
    rubric_scores: Record<string, number>;
    total_marks: number;
    created_at: string;
    updated_at: string;
}

export interface EvaluationResults {
    group_id: string;
    evaluations: Evaluation[];
    final_marks?: number;
    grade?: string;
    r1_marks?: number | null;
    r2_marks?: number | null;
    r3_marks?: number | null;
    final_phase_marks?: number | null;
    computed_at?: string;
}

export interface PresentationSchedule {
    schedule_id: string;
    group_id: string;
    group_name?: string;
    phase: 'REVIEW_1' | 'REVIEW_2' | 'REVIEW_3' | 'FINAL';
    presentation_time: string;
    venue: string;
    created_at: string;
}

export interface SmartSlotResult {
    suggested_slots: Array<{ time: string; venue: string; conflicts: number }>;
}

export interface GroupTask {
    task_id: string;
    group_id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    assigned_to: string | null;
    created_at: string;
    updated_at: string;
}

export interface GroupResource {
    resource_id: string;
    group_id: string;
    title: string;
    url: string;
    uploaded_by: string | null;
    created_at: string;
}

export interface StudentNote {
    note_id: string;
    student_id: string;
    content: string;
    updated_at: string;
}

export interface GuideAnalytics {
    group_id: string;
    group_name: string;
    status: string;
    logbook_count: number;
    pending_logbooks: number;
    task_completion_pct: number;
}

export interface PeerEvaluation {
    eval_id: string;
    group_id: string;
    evaluator_id: string;
    evaluatee_id: string;
    score: number;
    comments: string;
    created_at: string;
}

export interface ChatMessage {
    message_id: string;
    group_id: string;
    sender_id: string;
    sender_email?: string;
    content: string;
    is_announcement: boolean;
    is_committee_only: boolean;
    created_at: string;
}

export interface RubricTemplate {
    template_id: string;
    name: string;
    schema: Record<string, unknown>;
    created_at: string;
}

export interface OrphanStudent {
    student_id: string;
    prn_no: string;
    email: string;
    created_at: string;
}

export interface TriggerRemindersResult {
    message: string;
    details?: {
        alerted: number;
        checked: number;
    };
}

export interface AllocationPending {
    groups: ProjectGroup[];
    total: number;
}

export interface GuideRecommendation {
    faculty_id: string;
    email: string;
    expertise_tags: string[];
    current_workload: number;
    max_workload: number;
    match_score: number;
}

export interface HistoricProject {
    group_id: string;
    group_name: string;
    title: string;
    domain_tags: string[];
    similarity?: number;
}

export interface MappingsResponse {
    type: string;
    mappings: Record<string, Record<string, number>>;
}

export interface SaveMappingsResult {
    success: boolean;
    saved: number;
}

export interface SettingEntry {
    key: string;
    value: unknown;
}

export interface StatusMessage {
    message: string;
}

export interface TokenRefreshResponse {
    access_token: string;
    refresh_token: string;
}

// ─── API Client ──────────────────────────────────────────────────────────────

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

/**
 * Helper for multipart/form-data uploads — does NOT set Content-Type
 * (the browser auto-sets it with the boundary).
 */
async function apiUpload<T>(
    endpoint: string,
    formData: FormData,
    token: string
): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
    }
    return response.json();
}

export const api = {
    // ─── Auth ────────────────────────────────────────────────────────────────
    login: (email: string, password: string) =>
        apiCall<AuthResponse>('/auth/login', {
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
        apiCall<AuthResponse>('/auth/register', {
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
        apiCall<AuthResponse>('/auth/claim-account', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    refreshToken: (refreshToken: string) =>
        apiCall<TokenRefreshResponse>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken })
        }),

    logout: (refreshToken?: string) =>
        apiCall<StatusMessage>('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken })
        }),

    getMe: (token: string) =>
        apiCall<UserProfile>('/auth/me', { token, method: 'GET' }),

    // ─── Coordinator: Whitelist ──────────────────────────────────────────────
    uploadWhitelist: (token: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiUpload<WhitelistUploadResult>('/coordinator/whitelist/upload', formData, token);
    },

    getWhitelist: (token: string) =>
        apiCall<WhitelistEntry[]>('/coordinator/whitelist', { token, method: 'GET' }),

    // ─── Groups ──────────────────────────────────────────────────────────────
    getGroups: (token: string, status?: string) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        return apiCall<ProjectGroup[]>(`/groups${params.toString() ? '?' + params : ''}`, {
            token,
            method: 'GET'
        });
    },

    getGroupById: (token: string, groupId: string) =>
        apiCall<GroupDetail>(`/groups/${groupId}`, { token, method: 'GET' }),

    createGroup: (token: string, groupName: string) =>
        apiCall<ProjectGroup>('/groups', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_name: groupName })
        }),

    updateGroupStatus: (token: string, groupId: string, status: string) =>
        apiCall<ProjectGroup>(`/groups/${groupId}/status`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    // ─── Members ─────────────────────────────────────────────────────────────
    addMember: (token: string, groupId: string, prnNo: string) =>
        apiCall<MemberAddResult>(`/groups/${groupId}/members`, {
            token,
            method: 'POST',
            body: JSON.stringify({ prn_no: prnNo })
        }),

    getMembers: async (token: string, groupId: string): Promise<GroupMember[]> => {
        const res = await apiCall<{ members: GroupMember[] } | GroupMember[]>(`/groups/${groupId}/members`, { token, method: 'GET' });
        return Array.isArray(res) ? res : (res as any).members ?? [];
    },

    removeMember: (token: string, groupId: string, studentId: string) =>
        apiCall<StatusMessage>(`/groups/${groupId}/members/${studentId}`, {
            token,
            method: 'DELETE'
        }),

    // ─── Proposals ───────────────────────────────────────────────────────────
    submitProposal: (token: string, groupId: string, title: string, tags: string[]) =>
        apiCall<Proposal>(`/groups/${groupId}/proposals`, {
            token,
            method: 'POST',
            body: JSON.stringify({ title, domain_tags: tags })
        }),

    getProposals: (token: string, groupId: string) =>
        apiCall<Proposal[]>(`/groups/${groupId}/proposals`, { token, method: 'GET' }),

    approveProposal: (token: string, proposalId: string, isApproved: boolean) =>
        apiCall<Proposal>(`/groups/proposals/${proposalId}/approve`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({ is_approved: isApproved })
        }),

    // ─── Logbooks ────────────────────────────────────────────────────────────
    uploadEvidence: (token: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiUpload<UploadResult>('/upload', formData, token);
    },

    submitLogbook: (
        token: string,
        groupId: string,
        weekNumber: number,
        workSummary: string,
        evidenceUrl?: string
    ) =>
        apiCall<Logbook>(`/groups/${groupId}/logbooks`, {
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
        return apiCall<Logbook[]>(
            `/groups/${groupId}/logbooks${params.toString() ? '?' + params : ''}`,
            { token, method: 'GET' }
        );
    },

    approveLogbook: (token: string, logId: string, guideStatus: string, remarks?: string) =>
        apiCall<Logbook>(`/groups/logbooks/${logId}`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({
                guide_status: guideStatus,
                guide_remarks: remarks
            })
        }),

    // ─── Allocations (legacy) ────────────────────────────────────────────────
    getPendingAllocation: (token: string) =>
        apiCall<ProjectGroup[]>('/groups/allocation/pending', { token, method: 'GET' }),

    getAvailableGuides: (token: string) =>
        apiCall<GuideRecommendation[]>('/groups/allocation/guides', { token, method: 'GET' }),

    assignGuide: (token: string, groupId: string, guideId: string) =>
        apiCall<StatusMessage>('/groups/allocation/assign', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, guide_id: guideId })
        }),

    // ─── Evaluations ─────────────────────────────────────────────────────────
    submitEvaluation: (
        token: string,
        groupId: string,
        phase: string,
        rubricScores: Record<string, number>,
        totalMarks: number
    ) =>
        apiCall<Evaluation>('/evaluations', {
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
        return apiCall<Evaluation[]>(
            `/evaluations${params.toString() ? '?' + params : ''}`,
            { token, method: 'GET' }
        );
    },

    getEvaluationResults: (token: string, groupId: string) =>
        apiCall<EvaluationResults>(`/evaluations/results/${groupId}`, { token, method: 'GET' }),

    // ─── Schedules ───────────────────────────────────────────────────────────
    createSchedule: (token: string, groupId: string, phase: string, presentationTime: string, venue: string) =>
        apiCall<PresentationSchedule>('/schedules', {
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
        apiCall<PresentationSchedule[]>('/schedules', { token, method: 'GET' }),

    getSmartSlots: (token: string) =>
        apiCall<SmartSlotResult>('/schedules/smart-slots', { token, method: 'GET' }),

    // ─── Tasks ───────────────────────────────────────────────────────────────
    getTasks: (token: string, groupId: string) =>
        apiCall<GroupTask[]>(`/tasks/${groupId}`, { token, method: 'GET' }),

    createTask: (token: string, groupId: string, title: string, assignedTo?: string) =>
        apiCall<GroupTask>('/tasks', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, title, assigned_to: assignedTo })
        }),

    updateTaskStatus: (token: string, taskId: string, status: string) =>
        apiCall<GroupTask>(`/tasks/${taskId}/status`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    deleteTask: (token: string, taskId: string) =>
        apiCall<StatusMessage>(`/tasks/${taskId}`, { token, method: 'DELETE' }),

    // ─── Resources & Notes ───────────────────────────────────────────────────
    getGroupResources: (token: string, groupId: string) =>
        apiCall<GroupResource[]>(`/resources/${groupId}`, { token, method: 'GET' }),
        
    createResource: (token: string, groupId: string, title: string, url: string) =>
        apiCall<GroupResource>('/resources', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, title, url })
        }),
        
    getNote: (token: string) =>
        apiCall<StudentNote>('/notes', { token, method: 'GET' }),
        
    saveNote: (token: string, content: string) =>
        apiCall<StudentNote>('/notes', {
            token,
            method: 'POST',
            body: JSON.stringify({ content })
        }),

    // ─── Guide Analytics ─────────────────────────────────────────────────────
    getGuideAnalytics: (token: string) =>
        apiCall<GuideAnalytics[]>('/analytics/guide', { token, method: 'GET' }),
        
    bulkApproveLogbooks: (token: string, logbookIds: string[]) =>
        apiCall<StatusMessage>('/groups/logbooks/bulk-approve', {
            token,
            method: 'PATCH',
            body: JSON.stringify({ logbook_ids: logbookIds })
        }),
        
    checkPlagiarism: (token: string, proposalId: string) =>
        apiCall<Proposal>(`/groups/proposals/${proposalId}/plagiarism`, {
            token,
            method: 'PATCH'
        }),

    // ─── Coordinator Features ────────────────────────────────────────────────
    getOrphanStudents: (token: string) =>
        apiCall<OrphanStudent[]>('/coordinator/action/orphans', { token, method: 'GET' }),
        
    autoGroupOrphans: (token: string) =>
        apiCall<StatusMessage>('/coordinator/action/auto-group', {
            token,
            method: 'POST'
        }),
        
    getRubrics: (token: string) =>
        apiCall<RubricTemplate[]>('/rubrics', { token, method: 'GET' }),
        
    saveRubric: (token: string, name: string, schema: Record<string, unknown>) =>
        apiCall<RubricTemplate>('/rubrics', {
            token,
            method: 'POST',
            body: JSON.stringify({ name, schema })
        }),

    // ─── Committee ───────────────────────────────────────────────────────────
    searchHistoricProjects: (token: string, title: string) =>
        apiCall<HistoricProject[]>(`/committee/historic-projects?title=${encodeURIComponent(title)}`, { token, method: 'GET' }),

    // ─── Peer Evaluations ────────────────────────────────────────────────────
    submitPeerEvaluation: (token: string, groupId: string, evaluateeId: string, score: number, comments: string) =>
        apiCall<PeerEvaluation>('/peer-evaluations', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, evaluatee_id: evaluateeId, score, comments })
        }),

    getGroupPeerEvaluations: (token: string, groupId: string) =>
        apiCall<PeerEvaluation[]>(`/peer-evaluations/group/${groupId}`, { token, method: 'GET' }),

    // ─── Chat ────────────────────────────────────────────────────────────────
    getGroupChat: (token: string, groupId: string) =>
        apiCall<ChatMessage[]>(`/chat/group/${groupId}`, { token, method: 'GET' }),

    sendGroupMessage: (token: string, groupId: string, content: string) =>
        apiCall<ChatMessage>(`/chat/group/${groupId}`, {
            token,
            method: 'POST',
            body: JSON.stringify({ content })
        }),

    getAnnouncements: (token: string) =>
        apiCall<ChatMessage[]>('/chat/announcements', { token, method: 'GET' }),

    sendAnnouncement: (token: string, content: string) =>
        apiCall<ChatMessage>('/chat/announcements', {
            token,
            method: 'POST',
            body: JSON.stringify({ content })
        }),

    // ─── Cron Tasks (Coordinator Only) ───────────────────────────────────────
    triggerReminders: (token: string) =>
        apiCall<TriggerRemindersResult>('/coordinator/trigger-reminders', {
            token,
            method: 'POST'
        }),

    // ─── Allocation Engine (AI-powered) ──────────────────────────────────────
    getAllocationPending: (token: string) =>
        apiCall<AllocationPending>('/allocations/pending', { token, method: 'GET' }),

    getGuideRecommendations: (token: string, groupId: string) =>
        apiCall<GuideRecommendation[]>(`/allocations/recommend/${groupId}`, { token, method: 'GET' }),

    assignGuideAllocation: (token: string, groupId: string, guideId: string) =>
        apiCall<StatusMessage>('/allocations/assign', {
            token,
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, guide_id: guideId })
        }),

    // ─── PO/PSO Mappings ─────────────────────────────────────────────────────
    getMappings: (token: string, batchYear: number, type: 'PO' | 'PSO') =>
        apiCall<MappingsResponse>(`/mappings?batch_year=${batchYear}&type=${type}`, {
            token,
            method: 'GET'
        }),

    saveMappings: (token: string, mappingType: 'PO' | 'PSO', mappings: Record<string, Record<string, number>>, batchYear?: number) =>
        apiCall<SaveMappingsResult>('/mappings', {
            token,
            method: 'POST',
            body: JSON.stringify({ mapping_type: mappingType, mappings, batch_year: batchYear ?? new Date().getFullYear() })
        }),

    // ─── Settings ────────────────────────────────────────────────────────────
    getSettings: (token: string) =>
        apiCall<SettingEntry[]>('/settings', { token, method: 'GET' }),

    updateSettings: (token: string, key: string, value: unknown) =>
        apiCall<StatusMessage>('/settings', {
            token,
            method: 'POST',
            body: JSON.stringify({ key, value })
        }),
};
