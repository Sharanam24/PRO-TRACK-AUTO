import { Router } from 'express';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { getMilestones, createMilestone, completeMilestone } from '../controllers/milestones.js';

const router = Router({ mergeParams: true });

router.use(authenticateRequest);

// GET /api/groups/:group_id/milestones — any authenticated user can view
router.get('/', getMilestones);

// POST /api/groups/:group_id/milestones — COORDINATOR or GUIDE only
router.post('/', authorize('COORDINATOR', 'GUIDE'), createMilestone);

// PATCH /api/groups/:group_id/milestones/:milestone_id/complete — any authenticated user
router.patch('/:milestone_id/complete', completeMilestone);

export default router;
