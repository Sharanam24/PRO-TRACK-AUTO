import { Response } from 'express';
import { query, pool } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { rankGuides, GuideCandidate } from '../services/ml/allocationEngine.js';
import { createNotification } from '../services/notificationService.js';

// Recommend ranked guides for a project group (uses AI/ML allocation engine)
export async function recommendGuides(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { groupId } = req.params;

        // Fetch the group's domain_tags from the linked project proposal
        const proposalRows = await query(
            `SELECT pp.domain_tags
             FROM project_proposals pp
             JOIN project_groups g ON pp.group_id = g.group_id
             WHERE g.group_id = $1`,
            [groupId]
        );

        const domainTags: string[] =
            proposalRows.length > 0 && proposalRows[0].domain_tags
                ? (proposalRows[0].domain_tags as string[])
                : [];

        // Fetch all guides that are not yet at max workload
        const guideRows = await query(
            `SELECT f.faculty_id, u.email, f.expertise_tags, f.current_workload, f.max_workload
             FROM faculty_profiles f
             JOIN users u ON f.faculty_id = u.user_id
             WHERE f.current_workload < f.max_workload`
        );

        const guides: GuideCandidate[] = guideRows.map((row) => ({
            faculty_id: row.faculty_id as string,
            email: row.email as string,
            expertise_tags: (row.expertise_tags as string[]) ?? [],
            current_workload: Number(row.current_workload),
            max_workload: Number(row.max_workload),
        }));

        const recommendations = await rankGuides(guides, domainTags);

        res.status(200).json({
            group_id: groupId,
            domain_tags: domainTags,
            recommendations,
        });
    } catch (error) {
        console.error('Recommend guides error:', error);
        res.status(500).json({ error: 'Failed to fetch guide recommendations' });
    }
}

// Get all groups pending guide allocation
export async function getPendingAllocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const groups = await query(
            `SELECT 
                g.group_id,
                g.group_name,
                g.status,
                COUNT(gm.student_id) as member_count,
                g.created_at
             FROM project_groups g
             LEFT JOIN group_members gm ON g.group_id = gm.group_id
             WHERE g.guide_id IS NULL AND g.status = 'WAITING_ALLOCATION'
             GROUP BY g.group_id
             ORDER BY g.created_at ASC`
        );

        res.status(200).json({
            total_pending: groups.length,
            groups
        });
    } catch (error) {
        console.error('Get pending allocation error:', error);
        res.status(500).json({ error: 'Failed to fetch pending groups' });
    }
}

// Get available guides (with workload < 4)
export async function getAvailableGuides(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const guides = await query(
            `SELECT 
                f.faculty_id,
                u.email,
                f.expertise_tags,
                f.current_workload,
                f.max_workload,
                (f.max_workload - f.current_workload) as available_slots
             FROM faculty_profiles f
             JOIN users u ON f.faculty_id = u.user_id
             WHERE f.current_workload < f.max_workload
             ORDER BY f.current_workload ASC`
        );

        res.status(200).json({
            total_available: guides.length,
            guides
        });
    } catch (error) {
        console.error('Get available guides error:', error);
        res.status(500).json({ error: 'Failed to fetch available guides' });
    }
}

// Assign guide to group (Coordinator role) — atomic transaction guard (Requirement 1.7)
export async function assignGuide(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { group_id, guide_id } = req.body;

    if (!group_id || !guide_id) {
        res.status(400).json({ error: 'group_id and guide_id are required' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if group exists and has no guide (inside transaction)
        const groupResult = await client.query(
            'SELECT group_id, guide_id FROM project_groups WHERE group_id = $1',
            [group_id]
        );

        if (groupResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        if (groupResult.rows[0].guide_id !== null) {
            await client.query('ROLLBACK');
            res.status(409).json({
                error: 'Group already has a guide assigned',
                current_guide_id: groupResult.rows[0].guide_id
            });
            return;
        }

        // Re-check workload inside transaction with SELECT FOR UPDATE to prevent race conditions
        const guideResult = await client.query(
            `SELECT f.faculty_id, f.current_workload, f.max_workload
             FROM faculty_profiles f
             WHERE f.faculty_id = $1
             FOR UPDATE`,
            [guide_id]
        );

        if (guideResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Guide not found' });
            return;
        }

        const guide = guideResult.rows[0];
        if (Number(guide.current_workload) >= Number(guide.max_workload)) {
            await client.query('ROLLBACK');
            res.status(409).json({
                error: 'Guide has reached maximum workload',
                code: 'CONFLICT',
                current_workload: guide.current_workload,
                max_workload: guide.max_workload
            });
            return;
        }

        // Assign guide and update group status
        await client.query(
            `UPDATE project_groups 
             SET guide_id = $1, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
             WHERE group_id = $2`,
            [guide_id, group_id]
        );

        // Increment guide's workload
        await client.query(
            `UPDATE faculty_profiles 
             SET current_workload = current_workload + 1
             WHERE faculty_id = $1`,
            [guide_id]
        );

        await client.query('COMMIT');

        // Get updated group info (outside transaction — read-only)
        const updatedGroup = await query(
            `SELECT 
                g.group_id,
                g.group_name,
                g.guide_id,
                u.email as guide_email,
                g.status
             FROM project_groups g
             LEFT JOIN users u ON g.guide_id = u.user_id
             WHERE g.group_id = $1`,
            [group_id]
        );

        // Notify the guide and group members (Requirement 5.2)
        try {
            const members = await query(
                `SELECT student_id FROM group_members WHERE group_id = $1`,
                [group_id]
            );
            const group = updatedGroup[0] as { group_name: string };
            await Promise.all([
                createNotification({
                    userId: guide_id as string,
                    title: 'New Group Assigned',
                    message: `You have been assigned as guide for group "${group.group_name}".`,
                    type: 'approval',
                    priority: 'high',
                }),
                ...members.map((m) =>
                    createNotification({
                        userId: m.student_id as string,
                        title: 'Guide Assigned',
                        message: `A guide has been assigned to your group "${group.group_name}".`,
                        type: 'approval',
                        priority: 'medium',
                    })
                ),
            ]);
        } catch (notifErr) {
            console.error('Assign guide notification error:', notifErr);
        }

        res.status(200).json({
            message: 'Guide assigned to group',
            group: updatedGroup[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Assign guide error:', error);
        res.status(500).json({ error: 'Failed to assign guide' });
    } finally {
        client.release();
    }
}

// Unassign guide from group (Coordinator role)
export async function unassignGuide(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;

        // Check if group exists and has a guide
        const groups = await query(
            'SELECT group_id, guide_id FROM project_groups WHERE group_id = $1',
            [group_id]
        );

        if (groups.length === 0) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        const guide_id = groups[0].guide_id;

        if (guide_id === null) {
            res.status(400).json({ error: 'Group does not have a guide assigned' });
            return;
        }

        // Unassign guide and revert status
        await query(
            `UPDATE project_groups 
             SET guide_id = NULL, status = 'WAITING_ALLOCATION', updated_at = CURRENT_TIMESTAMP
             WHERE group_id = $1`,
            [group_id]
        );

        // Decrement guide's workload
        await query(
            `UPDATE faculty_profiles 
             SET current_workload = CASE 
                 WHEN current_workload > 0 THEN current_workload - 1 
                 ELSE 0 
             END
             WHERE faculty_id = $1`,
            [guide_id]
        );

        res.status(200).json({
            message: 'Guide unassigned from group',
            group_id
        });
    } catch (error) {
        console.error('Unassign guide error:', error);
        res.status(500).json({ error: 'Failed to unassign guide' });
    }
}

// Get guide's assigned groups
export async function getGuideGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { guide_id } = req.params;

        const groups = await query(
            `SELECT 
                g.group_id,
                g.group_name,
                g.status,
                COUNT(gm.student_id) as member_count,
                g.created_at
             FROM project_groups g
             LEFT JOIN group_members gm ON g.group_id = gm.group_id
             WHERE g.guide_id = $1
             GROUP BY g.group_id
             ORDER BY g.created_at DESC`,
            [guide_id]
        );

        res.status(200).json({
            guide_id,
            total_groups: groups.length,
            groups
        });
    } catch (error) {
        console.error('Get guide groups error:', error);
        res.status(500).json({ error: 'Failed to fetch guide groups' });
    }
}
