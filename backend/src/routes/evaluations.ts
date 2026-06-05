import { Router } from 'express';
import * as evaluationController from '../controllers/evaluations.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticateRequest);

/**
 * @swagger
 * /api/evaluations:
 *   post:
 *     summary: Submit an evaluation for a project group
 *     tags: [Evaluations]
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
 *               - phase
 *               - rubric_scores
 *               - total_marks
 *             properties:
 *               group_id:
 *                 type: string
 *               phase:
 *                 type: string
 *               rubric_scores:
 *                 type: object
 *               total_marks:
 *                 type: number
 *     responses:
 *       201:
 *         description: Evaluation submitted
 *       422:
 *         description: Validation error
 */
router.post(
    '/',
    authorize('COMMITTEE'),
    validateBody([
        body('group_id').isString().notEmpty().withMessage('group_id is required'),
        body('phase').isString().notEmpty().withMessage('phase is required'),
        body('rubric_scores')
            .exists()
            .isObject()
            .withMessage('rubric_scores must be an object'),
        body('total_marks')
            .isNumeric()
            .withMessage('total_marks must be a number'),
    ]),
    evaluationController.submitEvaluation
);

/**
 * @swagger
 * /api/evaluations:
 *   get:
 *     summary: Get all evaluations
 *     tags: [Evaluations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of evaluations
 */
router.get('/', evaluationController.getEvaluations);

/**
 * @swagger
 * /api/evaluations/results/{groupId}:
 *   get:
 *     summary: Get final evaluation results for a group
 *     tags: [Evaluations]
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
 *         description: Evaluation results for the group
 */
router.get('/results/:groupId', evaluationController.getResults);

export default router;
