export type ReviewType = 'Review I' | 'Review II' | 'Review III' | 'Final Viva';
export type SlotStatus = 'available' | 'scheduled' | 'conflict';
export type RoomType = 'Lab' | 'Classroom' | 'Conference Room';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
}

export interface Faculty {
  id: string;
  name: string;
  department: string;
}

export interface Group {
  id: string;
  name: string;
  topic: string;
  guideId: string;
}

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  roomId: string;
  groupId?: string;
  panelIds: string[]; // Faculty IDs
  status: SlotStatus;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  type: ReviewType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'draft' | 'published' | 'completed';
  slots: TimeSlot[];
}
