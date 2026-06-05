import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleEvent, TimeSlot } from './types';
import { mockGroups, mockRooms } from './mockData';

interface CalendarViewProps {
  schedule: ScheduleEvent;
  onUpdateSlot: (slotId: string, updates: Partial<TimeSlot>) => void;
}

export default function CalendarView({ schedule, onUpdateSlot: _onUpdateSlot }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(schedule.startDate));

  // Generate time slots from 09:00 to 17:00
  const timeBlock: string[] = [];
  for (let i = 9; i <= 16; i++) {
    timeBlock.push(`${i.toString().padStart(2, '0')}:00`);
    timeBlock.push(`${i.toString().padStart(2, '0')}:30`);
  }

  const dateStr = currentDate.toISOString().split('T')[0];
  const daySlots = schedule.slots.filter(s => s.date === dateStr);

  const prevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const nextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col h-[600px]">
      {/* Calendar Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button onClick={prevDay} className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextDay} className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-bold text-lg">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>
        
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Scheduled</span>
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Available</span>
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Conflict</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r border-white/[0.06] bg-zinc-900/50 sticky left-0 z-10">
            {timeBlock.map((time, i) => (
              <div key={time} className="h-16 border-b border-white/[0.02] relative">
                {i % 2 === 0 && (
                  <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-muted-foreground bg-zinc-950 px-1">
                    {time}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Rooms columns */}
          <div className="flex-1 flex min-w-[800px]">
            {mockRooms.map(room => (
              <div key={room.id} className="flex-1 border-r border-white/[0.06] relative">
                {/* Room Header */}
                <div className="h-10 border-b border-white/[0.06] flex items-center justify-center sticky top-0 bg-zinc-900 z-20 shadow-sm">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {room.name}
                  </span>
                </div>

                {/* Slots */}
                {timeBlock.map((time) => {
                  const slot = daySlots.find(s => s.roomId === room.id && s.startTime === time);
                  return (
                    <div key={time} className="h-16 border-b border-white/[0.02] relative p-1">
                      {slot && (
                        <div className={cn(
                          'absolute inset-1 rounded-lg p-2 text-xs border shadow-sm cursor-pointer transition-all hover:scale-[1.02] z-10',
                          slot.status === 'scheduled' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-100 hover:bg-indigo-500/30' :
                          slot.status === 'conflict' ? 'bg-rose-500/20 border-rose-500/30 text-rose-100' :
                          'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/80 border-dashed'
                        )}>
                          {slot.groupId ? (
                            <>
                              <div className="font-bold truncate text-indigo-300">{mockGroups.find(g => g.id === slot.groupId)?.name}</div>
                              <div className="flex items-center gap-1 mt-1 opacity-80 truncate text-[10px]">
                                <Users className="w-3 h-3" /> {slot.panelIds.length} Panel
                              </div>
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center font-medium opacity-50">+ Assign</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
