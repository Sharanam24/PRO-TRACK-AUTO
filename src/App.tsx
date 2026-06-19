import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Student
import { StudentDashboardNew } from './pages/Student/StudentDashboardNew';
import { StudentGroups } from './pages/Student/StudentGroups';
import { StudentLogbook } from './pages/Student/StudentLogbook';
import { StudentTasks } from './pages/Student/StudentTasks';
import { StudentPeerEvaluation } from './pages/Student/StudentPeerEvaluation';
import StudentResources from './pages/Student/StudentResources';

// Guide
import { GuideDashboardNew } from './pages/Guide/GuideDashboardNew';
import { GuideGroups } from './pages/Guide/GuideGroups';
import { GuideReviews } from './pages/Guide/GuideReviews';

// Coordinator
import { CoordinatorDashboardNew } from './pages/Coordinator/CoordinatorDashboardNew';
import { CoordinatorAllocations } from './pages/Coordinator/CoordinatorAllocations';
import { CoordinatorUsers } from './pages/Coordinator/CoordinatorUsers';
import { CoordinatorRubrics } from './pages/Coordinator/CoordinatorRubrics';
import { CoordinatorSchedules } from './pages/Coordinator/CoordinatorSchedules';
import { CoordinatorAnnouncements } from './pages/Coordinator/CoordinatorAnnouncements';

// Committee
import { CommitteeEvaluations } from './pages/Committee/CommitteeEvaluations';
import { CommitteeEvaluationNew } from './pages/Committee/CommitteeEvaluationNew';
import { CommitteeResults } from './pages/Committee/CommitteeResults';
import { CommitteeHistoricSearch } from './pages/Committee/CommitteeHistoricSearch';
import GroupChat from './pages/GroupChat';
import POPSOMapping from './pages/POPSOMapping';

export default function App() {
    const { isAuthenticated, user } = useAuthStore();

    return (
        <ErrorBoundary>
        <BrowserRouter>
            <Routes>
                {/* ── Public ── */}
                <Route
                    path="/"
                    element={
                        isAuthenticated && user
                            ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />
                            : <LandingPage />
                    }
                />
                <Route
                    path="/login"
                    element={
                        isAuthenticated && user
                            ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />
                            : <Login />
                    }
                />

                {/* ── Student ── */}
                <Route path="/student/dashboard" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><ErrorBoundary><StudentDashboardNew /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/student/groups" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><ErrorBoundary><StudentGroups /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/student/logbook" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><ErrorBoundary><StudentLogbook /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/student/tasks" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><ErrorBoundary><StudentTasks /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/student/peer-evaluation" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><ErrorBoundary><StudentPeerEvaluation /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/student/resources" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><ErrorBoundary><StudentResources /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/student/chat/:groupId" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><ErrorBoundary><GroupChat /></ErrorBoundary></ProtectedRoute>
                } />

                {/* ── Guide ── */}
                <Route path="/guide/dashboard" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><ErrorBoundary><GuideDashboardNew /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/guide/groups" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><ErrorBoundary><GuideGroups /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/guide/reviews" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><ErrorBoundary><GuideReviews /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/guide/chat/:groupId" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><ErrorBoundary><GroupChat /></ErrorBoundary></ProtectedRoute>
                } />

                {/* ── Coordinator ── */}
                <Route path="/coordinator/dashboard" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><ErrorBoundary><CoordinatorDashboardNew /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/coordinator/allocations" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><ErrorBoundary><CoordinatorAllocations /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/coordinator/users" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><ErrorBoundary><CoordinatorUsers /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/coordinator/rubrics" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><ErrorBoundary><CoordinatorRubrics /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/coordinator/schedules" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><ErrorBoundary><CoordinatorSchedules /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/coordinator/announcements" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><ErrorBoundary><CoordinatorAnnouncements /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/coordinator/po-pso" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><ErrorBoundary><POPSOMapping /></ErrorBoundary></ProtectedRoute>
                } />

                {/* ── Committee ── */}
                <Route path="/committee/dashboard" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><ErrorBoundary><CommitteeEvaluationNew /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/committee/evaluations" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><ErrorBoundary><CommitteeEvaluations /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/committee/results" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><ErrorBoundary><CommitteeResults /></ErrorBoundary></ProtectedRoute>
                } />
                <Route path="/committee/history" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><ErrorBoundary><CommitteeHistoricSearch /></ErrorBoundary></ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
        </ErrorBoundary>
    );
}
