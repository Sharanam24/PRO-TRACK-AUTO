import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, CheckCircle2, Clock, 
  Calendar, Check, Trash2, 
  ChevronRight, BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = 'deadline' | 'approval' | 'alert' | 'schedule';
type Priority = 'high' | 'medium' | 'low';

interface Notification {
  id: string;
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionRequired?: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    priority: 'high',
    title: 'AI Alert: Group G-08 At Risk',
    message: 'Nexus AI has detected 2 missed logbook submissions from Group G-08. Intervention recommended.',
    time: '10 mins ago',
    isRead: false,
    actionRequired: true
  },
  {
    id: '2',
    type: 'approval',
    priority: 'medium',
    title: 'Topic Proposal Approved',
    message: 'Your project topic "AI-Powered Academic ERP" has been approved by Dr. Sarah Jenkins.',
    time: '2 hours ago',
    isRead: false
  },
  {
    id: '3',
    type: 'deadline',
    priority: 'high',
    title: 'Review II Presentation Upload',
    message: 'Final PPT submission deadline is approaching in 48 hours. Ensure formatting guidelines are met.',
    time: '1 day ago',
    isRead: true,
    actionRequired: true
  },
  {
    id: '4',
    type: 'schedule',
    priority: 'low',
    title: 'Committee Evaluation Scheduled',
    message: 'Group G-14 is scheduled for Review I on Nov 12, Room 402 at 10:00 AM.',
    time: '2 days ago',
    isRead: true
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'action'>('all');

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'action') return n.actionRequired;
    return true;
  });

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'deadline': return <Clock className="w-5 h-5" />;
      case 'approval': return <CheckCircle2 className="w-5 h-5" />;
      case 'alert': return <BrainCircuit className="w-5 h-5" />;
      case 'schedule': return <Calendar className="w-5 h-5" />;
    }
  };

  const getColor = (type: NotificationType) => {
    switch (type) {
      case 'deadline': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'approval': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'alert': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'schedule': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl relative">
              <Bell className="w-8 h-8 text-indigo-500" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </div>
            Notification Center
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">Manage alerts, deadlines, and smart AI insights.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={markAllRead} className="px-4 py-2 border border-white/10 bg-card font-medium rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2">
            <Check className="w-4 h-4" /> Mark all read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Main Notification Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-6 p-1 bg-card border border-white/5 rounded-xl shadow-sm w-max">
            {(['all', 'unread', 'action'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                  filter === f ? "bg-indigo-500/10 text-indigo-500" : "hover:bg-white/5 text-muted-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            {filteredNotifs.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-white/10 rounded-2xl"
              >
                <Bell className="w-12 h-12 mb-4 opacity-20" />
                <p>You're all caught up!</p>
              </motion.div>
            ) : (
              filteredNotifs.map((notif) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  key={notif.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all relative overflow-hidden group",
                    !notif.isRead ? "bg-indigo-500/5 border-indigo-500/30" : "bg-card border-white/5",
                  )}
                  onClick={() => markAsRead(notif.id)}
                >
                  {!notif.isRead && <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500" />}
                  
                  <div className="flex gap-4">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 border", getColor(notif.type))}>
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={cn("font-bold text-base", !notif.isRead ? "text-foreground" : "text-muted-foreground")}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap ml-4">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pr-8">
                        {notif.message}
                      </p>

                      {notif.actionRequired && (
                        <div className="mt-4">
                          <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all">
                            Take Action
                          </button>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                      className="opacity-0 group-hover:opacity-100 absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Calendar & Overview */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-card shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Upcoming Schedule</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 relative">
                <div className="w-12 text-center shrink-0">
                  <div className="text-xs font-bold text-indigo-500 uppercase">Nov</div>
                  <div className="text-xl font-bold text-foreground">12</div>
                </div>
                <div className="absolute left-14 top-2 bottom-0 w-px bg-white/10" />
                <div className="flex-1 pb-4">
                  <h4 className="text-sm font-bold">Review I Evaluations</h4>
                  <p className="text-xs text-muted-foreground">Rooms 401-405 • 10:00 AM</p>
                </div>
              </div>
              
              <div className="flex gap-3 relative">
                <div className="w-12 text-center shrink-0">
                  <div className="text-xs font-bold text-amber-500 uppercase">Nov</div>
                  <div className="text-xl font-bold text-foreground">15</div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">Logbook Week 10 Due</h4>
                  <p className="text-xs text-muted-foreground">Portal closes at 11:59 PM</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              View Full Calendar <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 shadow-sm">
            <h3 className="font-bold text-lg mb-2">Notification Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">Customize how you receive alerts and summaries.</p>
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all">
              Manage Preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
