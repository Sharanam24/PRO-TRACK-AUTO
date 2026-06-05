export type UserRole = 'student' | 'faculty' | 'coordinator' | 'committee';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type Department = 'Computer Science' | 'Information Technology' | 'Electronics' | 'Mechanical' | 'Civil';
export type AcademicYear = '2024-25' | '2025-26' | '2026-27';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: Department;
  academicYear: AcademicYear;
  status: UserStatus;
  enrollmentId: string;
  phone: string;
  joinedAt: string;
  lastActive: string;
  permissions: string[];
}

export interface FilterState {
  search: string;
  role: UserRole | 'all';
  department: Department | 'all';
  status: UserStatus | 'all';
  academicYear: AcademicYear | 'all';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  students: number;
  faculty: number;
  committees: number;
  departments: number;
}
