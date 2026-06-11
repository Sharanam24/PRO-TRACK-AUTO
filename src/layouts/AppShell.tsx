import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, Search, LayoutDashboard, Users, BookOpen, CheckSquare, BarChart2, Target, Trophy, Star, ChevronDown, Sparkles, Calendar, FolderSync, CheckCircle2, GitMerge } from 'lucide-react';

interface AppShellProps {
    children: React.ReactNode;
    currentPage: string;
}

const navigationByRole = {
    STUDENT: [
        { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { label: 'My Groups', path: '/student/groups', icon: Users },
        { label: 'Group Tasks', path: '/student/tasks', icon: CheckSquare },
        { label: 'Logbook', path: '/student/logbook', icon: BookOpen },
        { label: 'Resource Hub', path: '/student/resources', icon: FolderSync },
        { label: 'Peer Eval', path: '/student/peer-evaluation', icon: Star },
    ],
    GUIDE: [
        { label: 'Dashboard', path: '/guide/dashboard', icon: LayoutDashboard },
        { label: 'My Groups', path: '/guide/groups', icon: Users },
        { label: 'Reviews', path: '/guide/reviews', icon: CheckSquare },
    ],
    COORDINATOR: [
        { label: 'Analytics', path: '/coordinator/dashboard', icon: BarChart2 },
        { label: 'Allocations', path: '/coordinator/allocations', icon: Target },
        { label: 'User Management', path: '/coordinator/users', icon: Users },
        { label: 'Schedules', path: '/coordinator/schedules', icon: Calendar },
        { label: 'Rubrics', path: '/coordinator/rubrics', icon: Target },
        { label: 'Announcements', path: '/coordinator/announcements', icon: Bell },
        { label: 'PO/PSO Mapping', path: '/coordinator/po-pso', icon: GitMerge },
    ],
    COMMITTEE: [
        { label: 'Dashboard', path: '/committee/dashboard', icon: Trophy },
        { label: 'Evaluations', path: '/committee/evaluations', icon: CheckCircle2 },
        { label: 'Final Results', path: '/committee/results', icon: Target },
        { label: 'Historic Search', path: '/committee/history', icon: Calendar },
    ],
};

const roleAccents: Record<string, string> = {
    STUDENT: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
    GUIDE: 'linear-gradient(135deg,#a855f7,#ec4899)',
    COORDINATOR: 'linear-gradient(135deg,#f97316,#ef4444)',
    COMMITTEE: 'linear-gradient(135deg,#f59e0b,#eab308)',
};

export const AppShell: React.FC<AppShellProps> = ({ children, currentPage }) => {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);

    if (!user) return <>{children}</>;

    const navigation = navigationByRole[user.role as keyof typeof navigationByRole] || [];
    const accent = roleAccents[user.role] || roleAccents.STUDENT;

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    const S = {
        root: {
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            position: 'relative' as const,
            background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 40%, #0a0f1e 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
        },
        blob1: { position: 'fixed' as const, top: -160, right: -160, width: 384, height: 384, background: 'rgba(59,130,246,0.08)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' as const, zIndex: 0 },
        blob2: { position: 'fixed' as const, bottom: -160, left: -160, width: 384, height: 384, background: 'rgba(168,85,247,0.08)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' as const, zIndex: 0 },
        sidebar: (open: boolean) => ({
            width: open ? 256 : 80,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column' as const,
            transition: 'width 0.3s ease',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            position: 'relative' as const,
            zIndex: 40,
        }),
        logoBar: { height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
        logoIcon: { padding: 6, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        logoText: { display: 'flex', alignItems: 'center', gap: 8 },
        nav: { flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column' as const, gap: 4, overflowY: 'auto' as const },
        navBtn: (active: boolean) => ({
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 12,
            border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: active ? 'white' : 'rgba(255,255,255,0.55)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left' as const,
        }),
        navIcon: (active: boolean) => ({
            padding: 6,
            borderRadius: 8,
            background: active ? accent : 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }),
        userBox: { padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' },
        userCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' },
        avatar: { width: 32, height: 32, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0 },
        main: { flex: 1, display: 'flex', flexDirection: 'column' as const, minWidth: 0, position: 'relative' as const, zIndex: 10 },
        topbar: { height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', flexShrink: 0 },
        searchWrap: { position: 'relative' as const, maxWidth: 320 },
        searchInput: { width: 320, padding: '8px 16px 8px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 13, outline: 'none' },
        content: { flex: 1, overflowY: 'auto' as const, padding: 24 },
    };

    return (
        <div style={S.root}>
            <div style={S.blob1} />
            <div style={S.blob2} />

            {/* Sidebar */}
            <aside style={S.sidebar(sidebarOpen)}>
                <div style={S.logoBar}>
                    {sidebarOpen && (
                        <div style={S.logoText}>
                            <div style={S.logoIcon}><Sparkles size={14} color="white" /></div>
                            <span style={{ fontWeight: 900, fontSize: 18 }}>
                                <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pro</span>
                                <span style={{ color: 'white' }}>Track</span>
                            </span>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: 8 }}>
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                <nav style={S.nav}>
                    {navigation.map(item => {
                        const Icon = item.icon;
                        const active = currentPage === item.path;
                        return (
                            <button key={item.path} onClick={() => navigate(item.path)} style={S.navBtn(active)}>
                                <div style={S.navIcon(active)}><Icon size={15} color="white" /></div>
                                {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>}
                                {active && sidebarOpen && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: accent }} />}
                            </button>
                        );
                    })}
                </nav>

                {sidebarOpen && (
                    <div style={S.userBox}>
                        <div style={S.userCard}>
                            <div style={S.avatar}>{user.email.charAt(0).toUpperCase()}</div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{user.email.split('@')[0]}</p>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', textTransform: 'capitalize' as const }}>{user.role.toLowerCase()}</p>
                                {user.role === 'STUDENT' && (user as any).prn_no && (
                                    <p style={{ fontSize: 10, color: '#93c5fd', margin: '2px 0 0', fontFamily: 'monospace' }}>PRN: {(user as any).prn_no}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main */}
            <div style={S.main}>
                <header style={S.topbar}>
                    <div style={S.searchWrap}>
                        <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Search..." style={S.searchInput} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
                        <button style={{ padding: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', borderRadius: 10, position: 'relative' as const }}>
                            <Bell size={18} />
                            <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg,#f87171,#ec4899)' }} />
                        </button>

                        <div style={{ position: 'relative' as const }}>
                            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', color: 'white' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                                    {user.email.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: 'white', margin: 0 }}>{user.email.split('@')[0]}</p>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'capitalize' as const }}>{user.role.toLowerCase()}</p>
                                </div>
                                <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>

                            {showUserMenu && (
                                <div style={{ position: 'absolute', right: 0, top: '110%', width: 220, background: '#1a1030', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: 'white', margin: 0 }}>{user.email}</p>
                                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', textTransform: 'capitalize' as const }}>{user.role.toLowerCase()}</p>
                                    </div>
                                    <div style={{ padding: 6 }}>
                                        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
                                            <LogOut size={15} /> Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main style={S.content}>
                    {children}
                </main>
            </div>

            <style>{`
                input { color: white; }
                input::placeholder { color: rgba(255,255,255,0.25); }
                button:hover { opacity: 0.85; }
            `}</style>
        </div>
    );
};
