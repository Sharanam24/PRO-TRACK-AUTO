import { Router } from 'express';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { downloadMarksheet, downloadAttainmentReport } from '../controllers/reports.js';

const router = Router();

// GET /api/reports/marksheet/:group_id — COORDINATOR or GUIDE
router.get(
    '/marksheet/:group_id',
    authenticateRequest,
    authorize('COORDINATOR', 'GUIDE'),
    downloadMarksheet
);

// GET /api/reports/attainment?batch_year=&type= — COORDINATOR only
router.get(
    '/attainment',
    authenticateRequest,
    authorize('COORDINATOR'),
    downloadAttainmentReport
);

export default router;
