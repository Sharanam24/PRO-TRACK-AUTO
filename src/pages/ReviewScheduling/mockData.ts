import type { Room, Faculty, Group, ScheduleEvent } from './types';

export const mockRooms: Room[] = [
  { id: 'r1', name: 'Lab 301', type: 'Lab', capacity: 30 },
  { id: 'r2', name: 'Lab 302', type: 'Lab', capacity: 30 },
  { id: 'r3', name: 'Conf Room A', type: 'Conference Room', capacity: 15 },
  { id: 'r4', name: 'Classroom 405', type: 'Classroom', capacity: 60 },
];

export const mockFaculty: Faculty[] = [
  { id: 'f1', name: 'Dr. Anita Desai', department: 'Computer Science' },
  { id: 'f2', name: 'Prof. Rajesh Kumar', department: 'Information Technology' },
  { id: 'f3', name: 'Dr. Meera Joshi', department: 'Electronics' },
  { id: 'f4', name: 'Dr. Sanjay Gupta', department: 'Computer Science' },
];

export const mockGroups: Group[] = [
  { id: 'g1', name: 'Team Alpha', topic: 'AI Attendance System', guideId: 'f1' },
  { id: 'g2', name: 'CodeCraft', topic: 'Collaborative Editor', guideId: 'f2' },
  { id: 'g3', name: 'DataMinds', topic: 'Healthcare Analytics', guideId: 'f3' },
  { id: 'g4', name: 'RoboTech', topic: 'Automated Drone', guideId: 'f4' },
];

const today = new Date();
const dateStr = (offset: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return d.toISOString().split('T')[0];
};

export const mockSchedules: ScheduleEvent[] = [
  {
    id: 's1',
    title: 'Mid-Term Review (Review II)',
    type: 'Review II',
    startDate: dateStr(2),
    endDate: dateStr(4),
    status: 'draft',
    slots: [
      { id: 'sl1', date: dateStr(2), startTime: '09:00', endTime: '09:30', roomId: 'r1', groupId: 'g1', panelIds: ['f2', 'f4'], status: 'scheduled' },
      { id: 'sl2', date: dateStr(2), startTime: '09:30', endTime: '10:00', roomId: 'r1', groupId: 'g2', panelIds: ['f1', 'f3'], status: 'scheduled' },
      { id: 'sl3', date: dateStr(2), startTime: '10:00', endTime: '10:30', roomId: 'r1', status: 'available', panelIds: [] },
      { id: 'sl4', date: dateStr(3), startTime: '11:00', endTime: '11:30', roomId: 'r3', groupId: 'g3', panelIds: ['f1', 'f2'], status: 'scheduled' },
    ]
  },
  {
    id: 's2',
    title: 'Final Viva Voce',
    type: 'Final Viva',
    startDate: dateStr(15),
    endDate: dateStr(18),
    status: 'published',
    slots: []
  }
];
