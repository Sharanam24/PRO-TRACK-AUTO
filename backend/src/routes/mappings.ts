import { Router } from 'express';
import { getMappings, saveMappings } from '../controllers/mappings.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateRequest);

/**
 * @swagger
 * /api/mappings:
 *   get:
 *     summary: Get CO/PO/PSO mappings
 *     tags: [Mappings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Mapping data
 */
router.get('/', getMappings);

/**
 * @swagger
 * /api/mappings:
 *   post:
 *     summary: Save CO/PO/PSO mappings
 *     tags: [Mappings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mapping_type
 *               - batch_year
 *               - mappings
 *             properties:
 *               mapping_type:
 *                 type: string
 *                 enum: [PO, PSO]
 *               batch_year:
 *                 type: integer
 *               mappings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Mappings saved
 *       422:
 *         description: Validation error
 */
router.post(
    '/',
    authorize('COORDINATOR'),
    validateBody([
        body('mapping_type')
            .isString()
            .isIn(['PO', 'PSO'])
            .withMessage('mapping_type must be one of: PO, PSO'),
        body('mappings')
            .exists()
            .withMessage('mappings is required'),
    ]),
    saveMappings
);

export default router;
