import type { ProjectGroup, Invitation, ActivityItem } from './types';

export const mockGroups: ProjectGroup[] = [
  {
    id: '1', name: 'Team Alpha', description: 'Building an AI-powered attendance system with facial recognition',
    topic: 'AI Attendance System', maxMembers: 4, createdAt: '2026-05-10', status: 'active', tags: ['AI/ML', 'Computer Vision'],
    members: [
      { id: '1', name: 'Krush Gabani', email: 'krush@uni.edu', avatar: 'Krush', role: 'leader', status: 'active', joinedAt: '2026-05-10' },
      { id: '2', name: 'Priya Sharma', email: 'priya@uni.edu', avatar: 'Priya', role: 'member', status: 'active', joinedAt: '2026-05-11' },
      { id: '3', name: 'Rahul Patel', email: 'rahul@uni.edu', avatar: 'Rahul', role: 'member', status: 'active', joinedAt: '2026-05-12' },
    ]
  },
  {
    id: '2', name: 'CodeCraft', description: 'Developing a real-time collaborative code editor',
    topic: 'Collaborative Code Editor', maxMembers: 5, createdAt: '2026-05-08', status: 'forming', tags: ['WebSockets', 'React'],
    members: [
      { id: '4', name: 'Anita Desai', email: 'anita@uni.edu', avatar: 'Anita', role: 'leader', status: 'active', joinedAt: '2026-05-08' },
      { id: '5', name: 'Vikram Singh', email: 'vikram@uni.edu', avatar: 'Vikram', role: 'member', status: 'invited', joinedAt: '2026-05-09' },
    ]
  },
  {
    id: '3', name: 'DataMinds', description: 'Healthcare analytics dashboard with predictive modeling',
    topic: 'Healthcare Analytics', maxMembers: 4, createdAt: '2026-05-05', status: 'active', tags: ['Data Science', 'Healthcare'],
    members: [
      { id: '6', name: 'Meera Joshi', email: 'meera@uni.edu', avatar: 'Meera', role: 'leader', status: 'active', joinedAt: '2026-05-05' },
      { id: '7', name: 'Arjun Nair', email: 'arjun@uni.edu', avatar: 'Arjun', role: 'member', status: 'active', joinedAt: '2026-05-06' },
      { id: '8', name: 'Sneha Reddy', email: 'sneha@uni.edu', avatar: 'Sneha', role: 'member', status: 'active', joinedAt: '2026-05-07' },
      { id: '9', name: 'Dev Kapoor', email: 'dev@uni.edu', avatar: 'Dev', role: 'viewer', status: 'active', joinedAt: '2026-05-08' },
    ]
  },
];

export const mockInvitations: Invitation[] = [
  { id: 'i1', groupName: 'CodeCraft', groupId: '2', invitedBy: 'Anita Desai', invitedByAvatar: 'Anita', sentAt: '2 hours ago', status: 'pending', message: 'Hey! We need a React expert for our collaborative editor project.' },
  { id: 'i2', groupName: 'CloudOps', groupId: '4', invitedBy: 'Raj Kumar', invitedByAvatar: 'Raj', sentAt: '1 day ago', status: 'pending', message: 'Would love to have you on our DevOps project team!' },
  { id: 'i3', groupName: 'FinTech Squad', groupId: '5', invitedBy: 'Sara Ali', invitedByAvatar: 'Sara', sentAt: '3 days ago', status: 'rejected' },
];

export const mockActivity: ActivityItem[] = [
  { id: 'a1', user: 'Priya Sharma', avatar: 'Priya', action: 'joined', target: 'Team Alpha', time: '2 hours ago', type: 'join' },
  { id: 'a2', user: 'Krush Gabani', avatar: 'Krush', action: 'promoted to leader in', target: 'Team Alpha', time: '5 hours ago', type: 'role' },
  { id: 'a3', user: 'Anita Desai', avatar: 'Anita', action: 'sent invite for', target: 'CodeCraft', time: '1 day ago', type: 'invite' },
  { id: 'a4', user: 'Meera Joshi', avatar: 'Meera', action: 'created group', target: 'DataMinds', time: '2 days ago', type: 'create' },
  { id: 'a5', user: 'Rahul Patel', avatar: 'Rahul', action: 'updated topic in', target: 'Team Alpha', time: '3 days ago', type: 'update' },
  { id: 'a6', user: 'Vikram Singh', avatar: 'Vikram', action: 'left group', target: 'CloudOps', time: '4 days ago', type: 'leave' },
];
