import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createNotification, emitBadgeUpdate } from '../services/notificationService.js';

// GET /api/notifications — returns all for the authenticated user, ordered by created_at DESC
export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const rows = await query(
            `SELECT notification_id, user_id, title, message, type, priority,
                    is_read, action_url, created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        const unread_count = rows.filter((n) => !n.is_read).length;

        res.status(200).json({ notifications: rows, unread_count });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

// PUT /api/notifications/:id/read
export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const rows = await query(
            `UPDATE notifications SET is_read = TRUE
             WHERE notification_id = $1
             RETURNING notification_id, user_id, title, message, type, priority,
                       is_read, action_url, created_at`,
            [id]
        );

        if (rows.length === 0) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        // Emit updated badge count after marking as read (Requirement 11.4)
        const userId = (rows[0] as { user_id: string }).user_id;
        await emitBadgeUpdate(userId);

        res.status(200).json({ notification: rows[0] });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
}

// DELETE /api/notifications/:id
export async function deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const rows = await query(
            `DELETE FROM notifications WHERE notification_id = $1
             RETURNING notification_id`,
            [id]
        );

        if (rows.length === 0) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.status(200).json({ success: true, notification_id: id });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
}

// PUT /api/notifications/mark-all-read
export async function markAllRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        await query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
            [userId]
        );

        // Emit updated badge count after marking all as read (Requirement 11.4)
        await emitBadgeUpdate(userId);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
}

// POST /api/notifications/bulk — COORDINATOR only
export async function bulkSend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { user_ids, title, message, type, priority, action_url } = req.body;

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            res.status(400).json({ error: 'user_ids array is required' });
            return;
        }
        if (!title || !message || !type || !priority) {
            res.status(400).json({ error: 'title, message, type, and priority are required' });
            return;
        }

        const created = await Promise.all(
            (user_ids as string[]).map((userId) =>
                createNotification({ userId, title, message, type, priority, action_url })
            )
        );

        res.status(201).json({ created: created.length, notifications: created });
    } catch (error) {
        console.error('Bulk send error:', error);
        res.status(500).json({ error: 'Failed to send bulk notifications' });
    }
}
