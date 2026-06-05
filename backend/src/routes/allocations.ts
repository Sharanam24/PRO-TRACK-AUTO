import { Router } from 'express';
import {
    recommendGuides,
    getPendingAllocation,
    getAvailableGuides,
    assignGuide,
    unassignGuide,
    getGuideGroups,
} from '../controllers/allocations.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateRequest);
router.use(authorize('COORDINATOR'));

/**
 * @swagger
 * /api/allocations/assign:
 *   post:
 *     summary: Assign a guide to a project group
 *     tags: [Allocations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - group_id
 *               - guide_id
 *             properties:
 *               group_id:
 *                 type: string
 *                 format: uuid
 *               guide_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Guide assigned successfully
 *       409:
 *         description: Guide already at max workload or group already has a guide
 *       422:
 *         description: Validation error
 */
router.post(
    '/assign',
    validateBody([
        body('group_id').isString().isUUID().withMessage('group_id must be a valid UUID'),
        body('guide_id').isString().isUUID().withMessage('guide_id must be a valid UUID'),
    ]),
    assignGuide
);

/**
 * @swagger
 * /api/allocations/recommend/{groupId}:
 *   get:
 *     summary: Get ranked guide recommendations for a group
 *     tags: [Allocations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ranked list of guide recommendations
 */
router.get('/recommend/:groupId', recommendGuides);

/**
 * @swagger
 * /api/allocations/pending:
 *   get:
 *     summary: Get all groups pending guide allocation
 *     tags: [Allocations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups awaiting allocation
 */
router.get('/pending', getPendingAllocation);

/**
 * @swagger
 * /api/allocations/available:
 *   get:
 *     summary: Get all available guides (below max workload)
 *     tags: [Allocations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of available guides
 */
router.get('/available', getAvailableGuides);

router.delete('/unassign/:groupId', unassignGuide);
router.get('/guide/:guide_id', getGuideGroups);

export default router;
