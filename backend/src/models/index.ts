import { v4 as uuidv4 } from 'uuid';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'faculty' | 'coordinator' | 'admin';
    department: string;
    createdAt: Date;
}

export interface Student extends User {
    enrollment: string;
    semester: number;
    advisor: string;
}

export interface Habit {
    id: string;
    studentId: string;
    title: string;
    description: string;
    category: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    status: 'active' | 'completed' | 'paused';
    createdAt: Date;
    updatedAt: Date;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    members: string[];
    createdBy: string;
    createdAt: Date;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
}

// Mock database
export const mockUsers: User[] = [
    {
        id: '1',
        email: 'student@example.com',
        name: 'John Doe',
        role: 'student',
        department: 'Computer Science',
        createdAt: new Date('2025-01-15')
    },
    {
        id: '2',
        email: 'faculty@example.com',
        name: 'Dr. Jane Smith',
        role: 'faculty',
        department: 'Computer Science',
        createdAt: new Date('2025-01-15')
    },
    {
        id: '3',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        department: 'Administration',
        createdAt: new Date('2025-01-15')
    }
];

export const mockStudents: Student[] = [
    {
        id: '1',
        email: 'student@example.com',
        name: 'John Doe',
        role: 'student',
        department: 'Computer Science',
        enrollment: 'CS001',
        semester: 3,
        advisor: 'Dr. Jane Smith',
        createdAt: new Date('2025-01-15')
    },
    {
        id: '4',
        email: 'student2@example.com',
        name: 'Sarah Johnson',
        role: 'student',
        department: 'Computer Science',
        enrollment: 'CS002',
        semester: 3,
        advisor: 'Dr. Jane Smith',
        createdAt: new Date('2025-01-15')
    },
    {
        id: '5',
        email: 'student3@example.com',
        name: 'Mike Wilson',
        role: 'student',
        department: 'Information Technology',
        enrollment: 'IT001',
        semester: 2,
        advisor: 'Dr. Robert Brown',
        createdAt: new Date('2025-01-15')
    }
];

export const mockHabits: Habit[] = [
    {
        id: uuidv4(),
        studentId: '1',
        title: 'Daily Reading',
        description: 'Read technical documentation for 30 minutes',
        category: 'Learning',
        frequency: 'daily',
        status: 'active',
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
    },
    {
        id: uuidv4(),
        studentId: '1',
        title: 'Code Review',
        description: 'Review peer code for quality',
        category: 'Development',
        frequency: 'weekly',
        status: 'active',
        createdAt: new Date('2025-02-05'),
        updatedAt: new Date('2025-02-05')
    },
    {
        id: uuidv4(),
        studentId: '4',
        title: 'Project Work',
        description: 'Work on semester project',
        category: 'Project',
        frequency: 'daily',
        status: 'active',
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
    }
];

export const mockGroups: Group[] = [
    {
        id: uuidv4(),
        name: 'CS Capstone Team',
        description: 'Team working on capstone project',
        members: ['1', '4'],
        createdBy: '1',
        createdAt: new Date('2025-02-01')
    },
    {
        id: uuidv4(),
        name: 'Study Group - Data Structures',
        description: 'Collaborative study group',
        members: ['1', '4', '5'],
        createdBy: '1',
        createdAt: new Date('2025-02-05')
    }
];

export const mockNotifications: Notification[] = [
    {
        id: uuidv4(),
        userId: '1',
        title: 'Habit Created',
        message: 'Your new habit "Daily Reading" has been created successfully',
        read: false,
        createdAt: new Date('2025-05-26')
    },
    {
        id: uuidv4(),
        userId: '1',
        title: 'Group Invitation',
        message: 'You have been invited to join "CS Capstone Team"',
        read: false,
        createdAt: new Date('2025-05-25')
    }
];
