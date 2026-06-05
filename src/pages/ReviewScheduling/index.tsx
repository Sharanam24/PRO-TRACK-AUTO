import { useState } from 'react';
import { Calendar as CalIcon, Plus, LayoutGrid, List } from 'lucide-react';
import { mockSchedules } from './mockData';
import ScheduleCard from './ScheduleCard';
import CreateScheduleModal from './CreateScheduleModal';
import CalendarView from './CalendarView';

export default function ReviewScheduling() {
  const [schedules, setSchedules] = useState(mockSchedules);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const handleCreate = (data: any) => {
    const newSchedule = {
      ...data,
      id: `s${Date.now()}`,
      status: 'draft',
      slots: [],
    };
    setSchedules([newSchedule, ...schedules]);
    setActiveScheduleId(newSchedule.id);
  };

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalIcon className="w-6 h-6 text-indigo-400" /> Review Scheduling
          </h2>
          <p className="text-muted-foreground text-sm">Manage timelines, slots, and panel allocations</p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeSchedule && (
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>
      </div>

      {/* Main Content */}
      {!activeScheduleId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schedules.map(schedule => (
            <ScheduleCard 
              key={schedule.id} 
              schedule={schedule} 
              onClick={() => setActiveScheduleId(schedule.id)} 
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setActiveScheduleId(null)} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">
              ← Back to Schedules
            </button>
            <div className="h-4 w-px bg-white/20" />
            <h3 className="font-bold">{activeSchedule?.title}</h3>
          </div>
          
          <CalendarView 
            schedule={activeSchedule!} 
            onUpdateSlot={() => {}} 
          />
        </div>
      )}

      {/* Modals */}
      <CreateScheduleModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSave={handleCreate} 
      />
    </div>
  );
}
