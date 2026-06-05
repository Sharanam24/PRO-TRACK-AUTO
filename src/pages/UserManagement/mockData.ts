import type { ManagedUser } from './types';

export const mockUsers: ManagedUser[] = [
  { id: 'u1', name: 'Aarav Mehta', email: 'aarav@uni.edu', avatar: 'Aarav', role: 'student', department: 'Computer Science', academicYear: '2025-26', status: 'active', enrollmentId: 'CS2025001', phone: '+91 98765 43210', joinedAt: '2025-08-01', lastActive: '2 hours ago', permissions: ['view_dashboard', 'submit_logbook', 'view_topics'] },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@uni.edu', avatar: 'Priya', role: 'student', department: 'Computer Science', academicYear: '2025-26', status: 'active', enrollmentId: 'CS2025002', phone: '+91 98765 43211', joinedAt: '2025-08-01', lastActive: '1 hour ago', permissions: ['view_dashboard', 'submit_logbook', 'view_topics'] },
  { id: 'u3', name: 'Rahul Patel', email: 'rahul@uni.edu', avatar: 'Rahul', role: 'student', department: 'Information Technology', academicYear: '2025-26', status: 'active', enrollmentId: 'IT2025001', phone: '+91 98765 43212', joinedAt: '2025-08-01', lastActive: '5 hours ago', permissions: ['view_dashboard', 'submit_logbook'] },
  { id: 'u4', name: 'Sneha Reddy', email: 'sneha@uni.edu', avatar: 'Sneha', role: 'student', department: 'Electronics', academicYear: '2025-26', status: 'inactive', enrollmentId: 'EC2025001', phone: '+91 98765 43213', joinedAt: '2025-08-01', lastActive: '3 days ago', permissions: ['view_dashboard'] },
  { id: 'u5', name: 'Vikram Singh', email: 'vikram@uni.edu', avatar: 'Vikram', role: 'student', department: 'Mechanical', academicYear: '2024-25', status: 'active', enrollmentId: 'ME2024001', phone: '+91 98765 43214', joinedAt: '2024-08-01', lastActive: '1 day ago', permissions: ['view_dashboard', 'submit_logbook', 'view_topics'] },
  { id: 'u6', name: 'Kavya Iyer', email: 'kavya@uni.edu', avatar: 'Kavya', role: 'student', department: 'Civil', academicYear: '2025-26', status: 'suspended', enrollmentId: 'CE2025001', phone: '+91 98765 43215', joinedAt: '2025-08-01', lastActive: '1 week ago', permissions: [] },
  { id: 'u7', name: 'Dr. Anita Desai', email: 'anita.d@uni.edu', avatar: 'Anita', role: 'faculty', department: 'Computer Science', academicYear: '2025-26', status: 'active', enrollmentId: 'FAC001', phone: '+91 98765 43216', joinedAt: '2020-06-15', lastActive: '30 min ago', permissions: ['view_dashboard', 'approve_topics', 'evaluate', 'manage_groups'] },
  { id: 'u8', name: 'Prof. Rajesh Kumar', email: 'rajesh.k@uni.edu', avatar: 'Rajesh', role: 'faculty', department: 'Information Technology', academicYear: '2025-26', status: 'active', enrollmentId: 'FAC002', phone: '+91 98765 43217', joinedAt: '2019-06-15', lastActive: '1 hour ago', permissions: ['view_dashboard', 'approve_topics', 'evaluate'] },
  { id: 'u9', name: 'Dr. Meera Joshi', email: 'meera.j@uni.edu', avatar: 'Meera', role: 'faculty', department: 'Electronics', academicYear: '2025-26', status: 'active', enrollmentId: 'FAC003', phone: '+91 98765 43218', joinedAt: '2021-06-15', lastActive: '3 hours ago', permissions: ['view_dashboard', 'approve_topics', 'evaluate', 'manage_groups'] },
  { id: 'u10', name: 'Dr. Sanjay Gupta', email: 'sanjay.g@uni.edu', avatar: 'Sanjay', role: 'committee', department: 'Computer Science', academicYear: '2025-26', status: 'active', enrollmentId: 'COM001', phone: '+91 98765 43219', joinedAt: '2018-06-15', lastActive: '4 hours ago', permissions: ['view_dashboard', 'evaluate', 'final_approval'] },
  { id: 'u11', name: 'Prof. Neha Verma', email: 'neha.v@uni.edu', avatar: 'Neha', role: 'committee', department: 'Information Technology', academicYear: '2025-26', status: 'active', enrollmentId: 'COM002', phone: '+91 98765 43220', joinedAt: '2017-06-15', lastActive: '6 hours ago', permissions: ['view_dashboard', 'evaluate', 'final_approval'] },
  { id: 'u12', name: 'Arjun Nair', email: 'arjun@uni.edu', avatar: 'Arjun', role: 'student', department: 'Computer Science', academicYear: '2026-27', status: 'active', enrollmentId: 'CS2026001', phone: '+91 98765 43221', joinedAt: '2026-01-15', lastActive: '20 min ago', permissions: ['view_dashboard', 'submit_logbook', 'view_topics'] },
  { id: 'u13', name: 'Tanvi Rao', email: 'tanvi@uni.edu', avatar: 'Tanvi', role: 'student', department: 'Information Technology', academicYear: '2026-27', status: 'active', enrollmentId: 'IT2026001', phone: '+91 98765 43222', joinedAt: '2026-01-15', lastActive: '45 min ago', permissions: ['view_dashboard', 'submit_logbook'] },
  { id: 'u14', name: 'Dev Kapoor', email: 'dev@uni.edu', avatar: 'Dev', role: 'student', department: 'Mechanical', academicYear: '2025-26', status: 'active', enrollmentId: 'ME2025001', phone: '+91 98765 43223', joinedAt: '2025-08-01', lastActive: '2 days ago', permissions: ['view_dashboard', 'submit_logbook', 'view_topics'] },
  { id: 'u15', name: 'Dr. Rohan Shah', email: 'rohan.s@uni.edu', avatar: 'Rohan', role: 'faculty', department: 'Mechanical', academicYear: '2025-26', status: 'inactive', enrollmentId: 'FAC004', phone: '+91 98765 43224', joinedAt: '2022-06-15', lastActive: '2 weeks ago', permissions: ['view_dashboard', 'approve_topics'] },
];

export const allPermissions = [
  { id: 'view_dashboard', label: 'View Dashboard', desc: 'Access main dashboard' },
  { id: 'submit_logbook', label: 'Submit Logbook', desc: 'Create and submit logbook entries' },
  { id: 'view_topics', label: 'View Topics', desc: 'Browse and select project topics' },
  { id: 'approve_topics', label: 'Approve Topics', desc: 'Review and approve student topics' },
  { id: 'evaluate', label: 'Evaluate', desc: 'Grade and evaluate student work' },
  { id: 'manage_groups', label: 'Manage Groups', desc: 'Create and manage project groups' },
  { id: 'final_approval', label: 'Final Approval', desc: 'Give final project approval' },
  { id: 'manage_users', label: 'Manage Users', desc: 'Add, edit, and remove users' },
  { id: 'view_analytics', label: 'View Analytics', desc: 'Access analytics dashboard' },
  { id: 'export_data', label: 'Export Data', desc: 'Export reports and data' },
];

export const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'] as const;
export const academicYears = ['2024-25', '2025-26', '2026-27'] as const;
export const roles = ['student', 'faculty', 'coordinator', 'committee'] as const;
export const statuses = ['active', 'inactive', 'suspended'] as const;
