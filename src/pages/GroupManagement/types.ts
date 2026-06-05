export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'leader' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'pending';
  joinedAt: string;
}

export interface ProjectGroup {
  id: string;
  name: string;
  description: string;
  topic: string;
  members: TeamMember[];
  maxMembers: number;
  createdAt: string;
  status: 'active' | 'forming' | 'archived';
  tags: string[];
}

export interface Invitation {
  id: string;
  groupName: string;
  groupId: string;
  invitedBy: string;
  invitedByAvatar: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  type: 'join' | 'leave' | 'invite' | 'role' | 'create' | 'update';
}
