import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * GET /api/groups/:group_id/milestones
 * Returns all milestones for a group ordered by due_date ascending.
 * Requirements: 9.2
 */
export async function getMilestones(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;
        const milestones = await query(
            `SELECT milestone_id, group_id, phase, title, due_date, completed_at, status, created_at
             FROM milestone_progress
             WHERE group_id = $1
             ORDER BY due_date ASC`,
            [group_id]
        );
        res.status(200).json(milestones);
    } catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
}

/**
 * POST /api/groups/:group_id/milestones
 * Creates a new milestone. Restricted to COORDINATOR and GUIDE roles.
 * Requirements: 9.3
 */
export async function createMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;
        const { title, due_date, phase } = req.body;

        if (!title || !due_date) {
            res.status(400).json({ error: 'title and due_date are required' });
            return;
        }

        const result = await query(
            `INSERT INTO milestone_progress (group_id, phase, title, due_date)
             VALUES ($1, $2, $3, $4)
             RETURNING milestone_id, group_id, phase, title, due_date, completed_at, status, created_at`,
            [group_id, phase || null, title, due_date]
        );

        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ error: 'Failed to create milestone' });
    }
}

/**
 * PATCH /api/groups/:group_id/milestones/:milestone_id/complete
 * Marks a milestone as COMPLETE and records completed_at timestamp.
 * Returns 404 if the milestone does not belong to the specified group.
 * Requirements: 9.4, 9.5
 */
export async function completeMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id, milestone_id } = req.params;

        const result = await query(
            `UPDATE milestone_progress
             SET status = 'COMPLETE', completed_at = NOW()
             WHERE milestone_id = $1 AND group_id = $2
             RETURNING milestone_id, group_id, phase, title, due_date, completed_at, status, created_at`,
            [milestone_id, group_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Milestone not found', code: 'NOT_FOUND' });
            return;
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Complete milestone error:', error);
        res.status(500).json({ error: 'Failed to complete milestone' });
    }
}
