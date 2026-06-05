import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import {
    BookOpen, Users, Clipboard, Star, Mail, Lock, Eye, EyeOff,
    ArrowRight, Sparkles, Menu, X, BookMarked, Target, ShieldCheck,
    BarChart3, GraduationCap, Layers, Zap,
    ChevronRight, Database, Bell, GitBranch,
} from 'lucide-react';

type Role = 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';

const ROLES = [
    { value: 'STUDENT' as Role, label: 'Student', description: 'Create groups, submit proposals & weekly logbooks', Icon: BookOpen, badge: 'Most Common', demo: { email: 'student1@example.com', password: 'Student@123' }, accent: '#3b82f6' },
    { value: 'GUIDE' as Role, label: 'Faculty Guide', description: 'Review logbooks & guide up to 4 student projects', Icon: Users, badge: 'Faculty', demo: { email: 'guide1@example.com', password: 'Guide@123' }, accent: '#a855f7' },
    { value: 'COORDINATOR' as Role, label: 'Coordinator', description: 'Manage groups, allocate guides & run analytics', Icon: Clipboard, badge: 'Admin', demo: { email: 'coordinator@example.com', password: 'Coordinator@123' }, accent: '#f97316' },
    { value: 'COMMITTEE' as Role, label: 'Committee', description: 'Evaluate final projects with rubric-based grading', Icon: Star, badge: 'Evaluator', demo: { email: 'committee@example.com', password: 'Committee@123' }, accent: '#f59e0b' },
];

const FEATURES = [
    { Icon: BookMarked, title: 'Digital Logbooks', desc: 'Students submit weekly entries digitally. Guides approve or request revisions with one click.', stat: '100% paperless', color: '#3b82f6' },
    { Icon: Target, title: 'Smart Allocation', desc: 'Auto-match guides to groups based on workload, expertise tags, and domain similarity.', stat: 'AI-powered', color: '#a855f7' },
    { Icon: ShieldCheck, title: 'Rubric Grading', desc: 'Committee members evaluate using a standardized rubric framework for fair scoring.', stat: 'Standardized', color: '#f59e0b' },
    { Icon: BarChart3, title: 'Real-time Analytics', desc: 'Track department-wide progress, overdue submissions, and guide workload distribution.', stat: 'Live dashboard', color: '#10b981' },
];

const STATS = [
    { value: '1,200+', label: 'Students', Icon: GraduationCap, color: '#3b82f6' },
    { value: '340+', label: 'Projects', Icon: Layers, color: '#a855f7' },
    { value: '48', label: 'Guides', Icon: Users, color: '#ec4899' },
    { value: '99.8%', label: 'Uptime', Icon: Zap, color: '#10b981' },
];

const NAV_LINKS = [
    { label: 'Features', id: 'features' },
    { label: 'How it Works', id: 'how-it-works' },
    { label: 'Roles', id: 'roles' },
];

const MockDashboard: React.FC = () => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, backdropFilter: 'blur(24px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#a855f7,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} color="white" />
                </div>
                <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Student Dashboard</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>Rahul Sharma · PRN2024001</p>
                </div>
            </div>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', display: 'inline-block' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[{ label: 'Group', value: 'GRP-04', color: '#3b82f6' }, { label: 'Logbooks', value: '8/12', color: '#a855f7' }, { label: 'Status', value: 'Active', color: '#34d399' }].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: item.color, margin: 0 }}>{item.value}</p>
                </div>
            ))}
        </div>
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Phase Progress</span>
                <span style={{ color: '#a855f7', fontWeight: 700 }}>Phase 2 of 4</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: '52%', background: 'linear-gradient(90deg,#a855f7,#3b82f6)', borderRadius: 99 }} />
            </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[{ action: 'Logbook #8 approved', time: '2h ago', color: '#34d399' }, { action: 'Guide reviewed Phase 2', time: '1d ago', color: '#3b82f6' }, { action: 'Proposal approved', time: '3d ago', color: '#a855f7' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{item.action}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{item.time}</span>
                </div>
            ))}
        </div>
    </div>
);

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { setAuth, setLoading, isLoading } = useAuthStore();
    const portalRef = useRef<HTMLDivElement>(null);

    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showClaim, setShowClaim] = useState(false);
    const [claimPrn, setClaimPrn] = useState('');
    const [claimEmail, setClaimEmail] = useState('');
    const [claimPassword, setClaimPassword] = useState('');
    const [claimConfirm, setClaimConfirm] = useState('');
    const [claimError, setClaimError] = useState('');
    const [claimLoading, setClaimLoading] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToPortal = () => portalRef.current?.scrollIntoView({ behavior: 'smooth' });
    const scrollTo = (id: string) => { setMobileMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Email and password are required'); return; }
        try {
            setLoading(true);
            const res = await api.login(email, password);
            setAuth(res.token, { user_id: res.user_id, email: res.email, role: res.role, prn_no: res.prn_no ?? null, roll_no: res.roll_no ?? null, batch_year: res.batch_year ?? null });
            navigate(`/${res.role.toLowerCase()}/dashboard`);
        } catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); }
        finally { setLoading(false); }
    };

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setClaimError('');
        if (selectedRole === 'STUDENT' && !claimPrn.trim()) { setClaimError('PRN is required for students'); return; }
        if (!claimEmail || !claimPassword) { setClaimError('Email and password are required'); return; }
        if (claimPassword !== claimConfirm) { setClaimError('Passwords do not match'); return; }
        try {
            setClaimLoading(true);
            const payload: any = { email: claimEmail.trim(), password: claimPassword, role: selectedRole as string };
            if (selectedRole === 'STUDENT') payload.prn_no = claimPrn.trim();
            const res = await api.claimAccount(payload);
            setAuth(res.token, { user_id: res.user_id, email: res.email, role: res.role, prn_no: res.prn_no ?? null, roll_no: res.roll_no ?? null, batch_year: res.batch_year ?? null });
            navigate(`/${res.role.toLowerCase()}/dashboard`);
        } catch (err) { setClaimError(err instanceof Error ? err.message : 'Failed to claim account'); }
        finally { setClaimLoading(false); }
    };

    const activeRole = ROLES.find(r => r.value === selectedRole);

    const S = {
        page: { background: '#0a0015', color: 'white', minHeight: '100vh', overflowX: 'hidden' as const, fontFamily: "'Inter', system-ui, sans-serif" },
        nav: { position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.3s', background: scrolled ? 'rgba(10,0,21,0.85)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none' },
        navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 80, display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
        logo: { display: 'flex', alignItems: 'center', gap: 10 },
        logoIcon: { width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg,#9333ea,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        logoText: { fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: 'white' },
        logoSpan: { background: 'linear-gradient(90deg,#a855f7,#3b82f6,#ec4899)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const },
        navLinks: { display: 'flex', gap: 32 },
        navLink: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' },
        loginBtn: { padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#9333ea,#3b82f6)', color: 'white', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
        section: { position: 'relative' as const, minHeight: '100vh', display: 'flex' as const, alignItems: 'center' as const, paddingTop: 80, overflow: 'hidden' as const },
        heroContent: { maxWidth: 1280, margin: '0 auto', padding: '80px 24px', width: '100%', display: 'grid' as const, gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' as const },
        badge: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, marginBottom: 32 },
        h1: { fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 24, color: 'white' },
        shimmer: { background: 'linear-gradient(90deg,#a855f7,#3b82f6,#ec4899)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const },
        subtitle: { fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 520, marginBottom: 40 },
        btnRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginBottom: 48 },
        primaryBtn: { padding: '16px 32px', borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#9333ea,#3b82f6)', color: 'white', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 },
        ghostBtn: { padding: '16px 32px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 },
        statsRow: { display: 'flex', gap: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' as const },
        statItem: { textAlign: 'center' as const },
        card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, transition: 'all 0.3s', cursor: 'default' },
        input: { width: '100%', padding: '12px 16px 12px 44px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    };

    return (
        <div style={S.page}>
            {/* NAVBAR */}
            <header style={S.nav}>
                <div style={S.navInner}>
                    <div style={S.logo}>
                        <div style={S.logoIcon}><Sparkles size={20} color="white" /></div>
                        <span style={S.logoText}>ProTrack<span style={S.logoSpan}>-Auto</span></span>
                    </div>
                    <nav style={{ ...S.navLinks, display: mobileMenuOpen ? 'none' : 'flex' }}>
                        {NAV_LINKS.map(l => <button key={l.id} style={S.navLink} onClick={() => scrollTo(l.id)}>{l.label}</button>)}
                    </nav>
                    <button style={S.loginBtn} onClick={scrollToPortal}>Login <ArrowRight size={16} /></button>
                </div>
            </header>

            {/* HERO */}
            <section style={S.section}>
                {/* Blobs */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, background: 'rgba(147,51,234,0.25)', borderRadius: '50%', filter: 'blur(120px)' }} />
                    <div style={{ position: 'absolute', top: '5%', right: '-10%', width: 500, height: 500, background: 'rgba(59,130,246,0.2)', borderRadius: '50%', filter: 'blur(120px)' }} />
                    <div style={{ position: 'absolute', bottom: '-5%', left: '30%', width: 400, height: 400, background: 'rgba(236,72,153,0.15)', borderRadius: '50%', filter: 'blur(100px)' }} />
                </div>

                <div style={S.heroContent}>
                    <div>
                        <div style={S.badge}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', display: 'inline-block' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)' }}>Academic Portal v2.0 · Live Now</span>
                        </div>
                        <h1 style={S.h1}>
                            Academic Projects.<br />
                            <span style={S.shimmer}>Zero Friction.</span>
                        </h1>
                        <p style={S.subtitle}>The unified platform for universities — from group formation to final evaluation. We automate the boring stuff so you can focus on building great things.</p>
                        <div style={S.btnRow}>
                            <button style={S.primaryBtn} onClick={scrollToPortal}>Access Portal <ArrowRight size={18} /></button>
                            <button style={S.ghostBtn} onClick={() => scrollTo('features')}>Explore Features <ChevronRight size={18} /></button>
                        </div>
                        <div style={S.statsRow}>
                            {STATS.map((s, i) => (
                                <div key={i} style={S.statItem}>
                                    <p style={{ fontSize: 24, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, margin: '4px 0 0' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'none' }} className="lg-mock">
                        <MockDashboard />
                    </div>
                    <div className="hero-mock">
                        <MockDashboard />
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" style={{ padding: '112px 24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, background: 'rgba(88,28,135,0.15)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
                <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
                    <div style={{ textAlign: 'center', marginBottom: 80 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.3em', color: '#a855f7', marginBottom: 16 }}>Core Platform</p>
                        <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, marginBottom: 20, color: 'white' }}>
                            Built for every role in<br /><span style={S.shimmer}>the academic process.</span>
                        </h2>
                        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 auto' }}>We replaced scattered tools with a single, cohesive ecosystem.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 24 }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={S.card}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                    <f.Icon size={24} color="white" />
                                </div>
                                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{f.stat}</p>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 10 }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                        {[
                            { Icon: GitBranch, title: 'Phase Tracking', desc: 'Move through Planning → Development → Testing → Submission with milestone deadlines.', color: '#7c3aed' },
                            { Icon: Bell, title: 'Smart Notifications', desc: 'Automated alerts for deadlines, approvals, rejections, and guide feedback.', color: '#e11d48' },
                            { Icon: Database, title: 'Centralized Storage', desc: 'Logbooks, proposals, and evaluations stored securely and accessible anytime.', color: '#0d9488' },
                        ].map((f, i) => (
                            <div key={i} style={{ ...S.card, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <f.Icon size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6 }}>{f.title}</h3>
                                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" style={{ padding: '112px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 80 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.3em', color: '#3b82f6', marginBottom: 16 }}>Project Lifecycle</p>
                        <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, marginBottom: 20, color: 'white' }}>Built for every step of the <span style={S.shimmer}>academic year.</span></h2>
                        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 auto' }}>A structured 4-phase timeline from day one to the final presentation.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
                        {[
                            { num: '01', title: 'Planning', desc: 'Form your group, submit your project proposal, and get it approved by your guide.', color: '#3b82f6', tags: ['Group Formation', 'Proposal'] },
                            { num: '02', title: 'Development', desc: 'Submit weekly logbooks documenting your progress. Guide reviews and approves entries.', color: '#a855f7', tags: ['Logbooks', 'Guide Review'] },
                            { num: '03', title: 'Testing', desc: 'Finalize implementation, run testing cycles, and document results in your logbook.', color: '#f59e0b', tags: ['Testing', 'Documentation'] },
                            { num: '04', title: 'Submission', desc: 'Present your completed project to the committee for rubric-based evaluation.', color: '#10b981', tags: ['Evaluation', 'Final Score'] },
                        ].map((phase, i) => (
                            <div key={i}>
                                <div style={{ width: 72, height: 72, borderRadius: 24, background: phase.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                    <span style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>{phase.num}</span>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 10 }}>Phase {i + 1} — {phase.title}</h3>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>{phase.desc}</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                                    {phase.tags.map(tag => (
                                        <span key={tag} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROLES */}
            <section id="roles" style={{ padding: '112px 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.3em', color: '#ec4899', marginBottom: 16 }}>Who is this for?</p>
                        <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, marginBottom: 20, color: 'white' }}>Tailored for your <span style={S.shimmer}>role.</span></h2>
                        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 auto' }}>Different responsibilities demand different interfaces.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
                        {ROLES.map((role, i) => (
                            <div key={i} style={S.card}>
                                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: role.accent, fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 20 }}>{role.badge}</span>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: role.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <role.Icon size={22} color="white" />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>{role.label}</h3>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{role.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* LOGIN PORTAL */}
            <section ref={portalRef} id="portal" style={{ padding: '112px 24px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.3em', color: '#a855f7', marginBottom: 16 }}>Access Portal</p>
                        <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, marginBottom: 16, color: 'white' }}>Sign in to <span style={S.shimmer}>ProTrack-Auto</span></h2>
                        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>Select your role to get started</p>
                    </div>

                    {!selectedRole ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' }}>
                            {ROLES.map(role => (
                                <button key={role.value} onClick={() => setSelectedRole(role.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.2s', color: 'white' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: role.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <role.Icon size={24} color="white" />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>{role.label}</h3>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 16 }}>{role.description}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Select Role</span>
                                        <ArrowRight size={16} color="rgba(255,255,255,0.5)" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{ maxWidth: 480, margin: '0 auto' }}>
                            <button onClick={() => { setSelectedRole(null); setEmail(''); setPassword(''); setError(''); setShowClaim(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 14 }}>
                                <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to roles
                            </button>

                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 40 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: activeRole?.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {activeRole && <activeRole.Icon size={24} color="white" />}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: 0 }}>{showClaim ? 'Claim Account' : activeRole?.label}</h2>
                                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{showClaim ? 'Set up your account' : 'Enter your credentials'}</p>
                                    </div>
                                </div>

                                {!showClaim ? (
                                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 8 }}>Email Address</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} placeholder="you@example.com" />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 8 }}>Password</label>
                                            <div style={{ position: 'relative' }}>
                                                <Lock size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...S.input, paddingRight: 44 }} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
                                        <button type="submit" disabled={isLoading} style={{ padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${activeRole?.accent || '#a855f7'}, #3b82f6)`, color: 'white', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            {isLoading ? 'Signing in...' : 'Sign In to Dashboard'} <ArrowRight size={18} />
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {selectedRole === 'STUDENT' && (
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 8 }}>PRN Number</label>
                                                <input type="text" value={claimPrn} onChange={e => setClaimPrn(e.target.value)} style={{ ...S.input, paddingLeft: 16 }} placeholder="e.g. PRN001" />
                                            </div>
                                        )}
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 8 }}>Email</label>
                                            <input type="email" value={claimEmail} onChange={e => setClaimEmail(e.target.value)} style={{ ...S.input, paddingLeft: 16 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 8 }}>Password</label>
                                            <input type="password" value={claimPassword} onChange={e => setClaimPassword(e.target.value)} style={{ ...S.input, paddingLeft: 16 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 8 }}>Confirm Password</label>
                                            <input type="password" value={claimConfirm} onChange={e => setClaimConfirm(e.target.value)} style={{ ...S.input, paddingLeft: 16 }} />
                                        </div>
                                        {claimError && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#fca5a5', fontSize: 14 }}>{claimError}</div>}
                                        <button type="submit" disabled={claimLoading} style={{ padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${activeRole?.accent || '#a855f7'}, #3b82f6)`, color: 'white', fontWeight: 700, fontSize: 16 }}>
                                            {claimLoading ? 'Claiming...' : 'Claim Account'}
                                        </button>
                                    </form>
                                )}

                                {selectedRole === 'STUDENT' && (
                                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
                                        <button onClick={() => { setShowClaim(!showClaim); setError(''); setClaimError(''); }} style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: 13 }}>
                                            {showClaim ? 'Already have an account? Sign in' : 'New student? Claim your account'}
                                        </button>
                                    </p>
                                )}

                                {/* Demo credentials */}
                                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Demo Credentials</p>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Email</span>
                                            <span style={{ fontSize: 12, color: '#93c5fd', fontFamily: 'monospace' }}>{activeRole?.demo.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Password</span>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{activeRole?.demo.password}</span>
                                        </div>
                                        <button type="button" onClick={() => { if (activeRole) { setEmail(activeRole.demo.email); setPassword(activeRole.demo.password); } }} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', cursor: 'pointer' }}>
                                            ↑ Auto-fill Credentials
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>© 2024 ProTrack-Auto · Academic Project Lifecycle Management</p>
            </footer>

            <style>{`
                .hero-mock { display: block; }
                @media (max-width: 768px) {
                    .hero-mock { display: none; }
                }
                button:hover { opacity: 0.9; }
                input { color: white; }
                input::placeholder { color: rgba(255,255,255,0.25); }
                input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #0a0015 inset !important; -webkit-text-fill-color: white !important; }
            `}</style>
        </div>
    );
};

export default LandingPage;
