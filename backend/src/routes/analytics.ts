import { Router } from 'express';
import {
    getGuideAnalytics,
    getCoordinatorDashboard,
    getPerformanceTrends,
    getGuideDistribution,
    getAtRiskGroups,
    getAttainment,
} from '../controllers/analytics.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticateRequest);

router.get('/guide', authorize('GUIDE'), getGuideAnalytics);

// Coordinator-scoped analytics (Requirement 6.7)
router.get('/coordinator/dashboard', authorize('COORDINATOR'), getCoordinatorDashboard);
router.get('/coordinator/trends', authorize('COORDINATOR'), getPerformanceTrends);
router.get('/coordinator/guide-distribution', authorize('COORDINATOR'), getGuideDistribution);
router.get('/coordinator/at-risk', authorize('COORDINATOR'), getAtRiskGroups);

// PO/PSO attainment (Requirements 13, 18)
router.get('/attainment', authorize('COORDINATOR'), getAttainment);

export default router;
