// API endpoint configuration
const API_URL = '/api';

interface FetchOptions extends RequestInit {
    params?: Record<string, any>;
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
    const { params, ...fetchOptions } = options;

    let url = `${API_URL}${endpoint}`;

    // Add query parameters
    if (params) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query.append(key, String(value));
            }
        });
        if (query.toString()) {
            url += `?${query.toString()}`;
        }
    }

    // Add token if available
    const token = localStorage.getItem('authToken');
    if (token) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    const response = await fetch(url, {
        ...fetchOptions,
        headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

// Auth APIs
export const authAPI = {
    login: (email: string, password: string) =>
        fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),
    logout: () =>
        fetchAPI('/auth/logout', { method: 'POST' }),
    getCurrentUser: (userId: string) =>
        fetchAPI('/auth/me', { params: { userId } })
};

// Student APIs
export const studentAPI = {
    getAll: () => fetchAPI('/students'),
    getById: (id: string) => fetchAPI(`/students/${id}`),
    create: (data: any) =>
        fetchAPI('/students', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id: string, data: any) =>
        fetchAPI(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id: string) =>
        fetchAPI(`/students/${id}`, { method: 'DELETE' })
};

// Habit APIs
export const habitAPI = {
    getAll: (studentId?: string) =>
        fetchAPI('/habits', { params: studentId ? { studentId } : {} }),
    getById: (id: string) => fetchAPI(`/habits/${id}`),
    create: (data: any) =>
        fetchAPI('/habits', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id: string, data: any) =>
        fetchAPI(`/habits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id: string) =>
        fetchAPI(`/habits/${id}`, { method: 'DELETE' })
};

// Group APIs
export const groupAPI = {
    getAll: () => fetchAPI('/groups'),
    getById: (id: string) => fetchAPI(`/groups/${id}`),
    create: (data: any) =>
        fetchAPI('/groups', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    addMember: (id: string, memberId: string) =>
        fetchAPI(`/groups/${id}/members`, {
            method: 'POST',
            body: JSON.stringify({ memberId })
        }),
    removeMember: (id: string, memberId: string) =>
        fetchAPI(`/groups/${id}/members`, {
            method: 'DELETE',
            body: JSON.stringify({ memberId })
        }),
    delete: (id: string) =>
        fetchAPI(`/groups/${id}`, { method: 'DELETE' })
};

// Notification APIs
export const notificationAPI = {
    getAll: (userId: string) =>
        fetchAPI('/notifications', { params: { userId } }),
    markAsRead: (id: string) =>
        fetchAPI(`/notifications/${id}/read`, { method: 'PUT' }),
    delete: (id: string) =>
        fetchAPI(`/notifications/${id}`, { method: 'DELETE' })
};
