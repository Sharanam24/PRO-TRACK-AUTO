import { Router } from 'express';
import * as notificationController from '../controllers/notifications.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateRequest);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/mark-all-read', notificationController.markAllRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: Send bulk notifications to multiple users (Coordinator only)
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *               - title
 *               - message
 *               - type
 *               - priority
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk notifications sent
 *       422:
 *         description: Validation error
 */
router.post(
    '/bulk',
    authorize('COORDINATOR'),
    validateBody([
        body('user_ids').isArray({ min: 1 }).withMessage('user_ids must be a non-empty array'),
        body('title').isString().notEmpty().withMessage('title is required'),
        body('message').isString().notEmpty().withMessage('message is required'),
        body('type').isString().notEmpty().withMessage('type is required'),
        body('priority').isString().notEmpty().withMessage('priority is required'),
    ]),
    notificationController.bulkSend
);

export default router;
