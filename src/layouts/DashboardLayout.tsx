import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, Users, Briefcase, BarChart3, LogOut, 
  Menu, ChevronLeft, ChevronRight, Bell, Search, Moon, Sun, Sparkles, Activity, Grid3x3, FolderOpen, Calendar, Kanban, Star
} from "lucide-react";
import { useStore } from "../store/useStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout() {
  const { role, name, isDarkMode, toggleTheme, logout } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Define navigation based on role
  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { name: "Overview", icon: Home, path: "/student" },
          { name: "Topics", icon: Search, path: "/student/topics" },
          { name: "Groups", icon: Users, path: "/student/groups" },
          { name: "Group Tasks", icon: Kanban, path: "/student/tasks" },
          { name: "Logbook", icon: Briefcase, path: "/student/logbook" },
          { name: "Documents", icon: FolderOpen, path: "/student/documents" },
          { name: "Peer Eval", icon: Star, path: "/student/peer-evaluation" },
        ];
      case 'faculty':
        return [
          { name: "Overview", icon: Home, path: "/faculty" },
          { name: "My Groups", icon: Users, path: "/faculty/groups" },
          { name: "Topics", icon: Search, path: "/faculty/topics" },
          { name: "Approvals", icon: Briefcase, path: "#" },
          { name: "Evaluation", icon: BarChart3, path: "/faculty/evaluation" },
        ];
      case 'coordinator':
        return [
          { name: "Advanced Analytics", icon: Activity, path: "/coordinator" },
          { name: "Department Overview", icon: BarChart3, path: "/coordinator/overview" },
          { name: "Review Scheduling", icon: Calendar, path: "/coordinator/scheduling" },
          { name: "User Management", icon: Users, path: "/coordinator/users" },
          { name: "AI Allocation", icon: Sparkles, path: "/ai-allocation" },
          { name: "PO / PSO Mapping", icon: Grid3x3, path: "/coordinator/po-pso" },
        ];
      case 'committee':
        return [
          { name: "Live Evaluation", icon: BarChart3, path: "/committee" },
          { name: "Schedule", icon: Briefcase, path: "#" },
          { name: "Reports", icon: Home, path: "#" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!role) {
    navigate("/");
    return null;
  }

  return (
    <div className={cn(
      "flex h-screen overflow-hidden transition-colors duration-300 font-sans",
      isDarkMode ? "bg-[#020617] text-slate-200" : "bg-slate-50 text-slate-900"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r transition-all duration-300 z-20 relative",
        isDarkMode ? "bg-[#09090b]/90 border-white/10 backdrop-blur-xl" : "bg-white border-slate-200",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("h-16 flex items-center px-4 border-b", isDarkMode ? "border-white/10" : "border-slate-100", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight leading-none">ProTrack</span>
                <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">{role}</span>
              </div>
            )}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={cn("p-1.5 rounded-md", isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100")}>
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? isDarkMode ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                    : isDarkMode ? "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <item.icon className={cn("w-5 h-5", !isCollapsed && "mr-3", isActive ? "text-indigo-500" : "text-slate-500")} />
                {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn("p-4 border-t", isDarkMode ? "border-white/10" : "border-slate-100")}>
          <button onClick={handleLogout} className={cn(
            "w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-rose-500 hover:bg-rose-500/10",
            isCollapsed ? "justify-center" : ""
          )}>
            <LogOut className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 shrink-0 z-10 backdrop-blur-md",
          isDarkMode ? "bg-[#020617]/50 border-white/10" : "bg-white/50 border-slate-200"
        )}>
          <div className="flex items-center gap-2">
            <Menu className="w-5 h-5 md:hidden" />
            <h1 className="text-lg font-bold capitalize hidden md:block">
              {location.pathname.replace("/", "").replace("-", " ") || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className={cn(
                  "w-full pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-none transition-all",
                  isDarkMode ? "bg-slate-900 border-white/10 focus:border-indigo-500" : "bg-slate-50 border-slate-200 focus:border-indigo-400"
                )}
              />
            </div>
            
            <button onClick={toggleTheme} className={cn("p-2 rounded-full", isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100")}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/notifications" className={cn("relative p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100")}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-transparent"></span>
            </Link>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] cursor-pointer">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt="Avatar" className="w-full h-full rounded-full bg-slate-900" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
