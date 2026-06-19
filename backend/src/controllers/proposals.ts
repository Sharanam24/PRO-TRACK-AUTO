import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { tagDomains } from '../services/ml/domainTagger.js';

// Submit a project proposal
export async function submitProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;
        const { title, domain_tags, description } = req.body;

        if (!title) {
            res.status(400).json({ error: 'title is required' });
            return;
        }

        // Auto-tag domains if not provided (Requirement 15.3, 15.4)
        let tags: string[];
        if (Array.isArray(domain_tags) && domain_tags.length > 0) {
            tags = domain_tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean);
        } else {
            tags = tagDomains(title + ' ' + (description ?? ''));
        }

        // Check entry window enforcement
        try {
            const settingsRows = await query(
                `SELECT key, value FROM global_settings WHERE key IN ('entry_window_open', 'entry_window_close')`,
                []
            );

            const settingsMap: Record<string, string> = {};
            for (const row of settingsRows) {
                settingsMap[String(row.key)] = String(row.value);
            }

            const windowOpenVal = settingsMap['entry_window_open'];
            const windowCloseVal = settingsMap['entry_window_close'];

            if (windowOpenVal && windowCloseVal) {
                const windowOpen = new Date(windowOpenVal);
                const windowClose = new Date(windowCloseVal);
                const now = Date.now();

                if (now < windowOpen.getTime() || now > windowClose.getTime()) {
                    res.status(403).json({
                        error: 'Submission window is closed',
                        code: 'WINDOW_CLOSED',
                        window_open: windowOpen.toISOString(),
                        window_close: windowClose.toISOString()
                    });
                    return;
                }
            }
            // If either setting is absent/null, allow submission to proceed
        } catch {
            // If query fails (e.g. table doesn't exist), allow submission to proceed
        }

        // Check if group exists
        const groups = await query(
            'SELECT group_id FROM project_groups WHERE group_id = $1',
            [group_id]
        );

        if (groups.length === 0) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        // Check if proposal already exists
        const existing = await query(
            'SELECT proposal_id FROM project_proposals WHERE group_id = $1',
            [group_id]
        );

        if (existing.length > 0) {
            res.status(409).json({
                error: 'Group already has a proposal. Update or delete the existing one.',
                proposal_id: existing[0].proposal_id
            });
            return;
        }

        // Create proposal
        const result = await query(
            `INSERT INTO project_proposals (group_id, title, domain_tags, is_approved) 
             VALUES ($1, $2, $3, false)
             RETURNING proposal_id, group_id, title, domain_tags, is_approved, created_at`,
            [group_id, title, tags]
        );

        const proposal = result[0];

        res.status(201).json({
            message: 'Proposal submitted successfully',
            proposal
        });
    } catch (error) {
        console.error('Submit proposal error:', error);
        res.status(500).json({ error: 'Failed to submit proposal' });
    }
}

// Get proposals for a group
export async function getProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;

        const proposals = await query(
            `SELECT 
                proposal_id,
                group_id,
                title,
                domain_tags,
                is_approved,
                created_at,
                updated_at
             FROM project_proposals
             WHERE group_id = $1
             ORDER BY created_at DESC`,
            [group_id]
        );

        res.status(200).json({
            group_id,
            total_proposals: proposals.length,
            proposals
        });
    } catch (error) {
        console.error('Get proposals error:', error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
}

// Approve/Reject proposal (Coordinator/Admin only)
export async function approveProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;
        const { is_approved } = req.body;

        if (typeof is_approved !== 'boolean') {
            res.status(400).json({ error: 'is_approved must be a boolean' });
            return;
        }

        const result = await query(
            `UPDATE project_proposals 
             SET is_approved = $1, updated_at = CURRENT_TIMESTAMP
             WHERE proposal_id = $2
             RETURNING proposal_id, group_id, title, is_approved, updated_at`,
            [is_approved, proposal_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        const proposal = result[0];

        res.status(200).json({
            message: `Proposal ${is_approved ? 'approved' : 'rejected'}`,
            proposal
        });
    } catch (error) {
        console.error('Approve proposal error:', error);
        res.status(500).json({ error: 'Failed to approve/reject proposal' });
    }
}

// Update proposal
export async function updateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;
        const { title, domain_tags } = req.body;

        const tags = Array.isArray(domain_tags)
            ? domain_tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
            : undefined;

        let sql = 'UPDATE project_proposals SET updated_at = CURRENT_TIMESTAMP';
        const params: unknown[] = [];
        let paramCount = 1;

        if (title) {
            sql += `, title = $${paramCount}`;
            params.push(title);
            paramCount++;
        }

        if (tags) {
            sql += `, domain_tags = $${paramCount}`;
            params.push(tags);
            paramCount++;
        }

        sql += ` WHERE proposal_id = $${paramCount} RETURNING proposal_id, title, domain_tags, updated_at`;
        params.push(proposal_id);

        const result = await query(sql, params);

        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.status(200).json({
            message: 'Proposal updated',
            proposal: result[0]
        });
    } catch (error) {
        console.error('Update proposal error:', error);
        res.status(500).json({ error: 'Failed to update proposal' });
    }
}

// Delete proposal
export async function deleteProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;

        const result = await query(
            'DELETE FROM project_proposals WHERE proposal_id = $1 RETURNING proposal_id',
            [proposal_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.status(200).json({
            message: 'Proposal deleted',
            proposal_id
        });
    } catch (error) {
        console.error('Delete proposal error:', error);
        res.status(500).json({ error: 'Failed to delete proposal' });
    }
};

export const checkPlagiarism = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { proposal_id } = req.params;
        
        // Dummy simulation: generate a random score between 0 and 40
        const fakeScore = Math.floor(Math.random() * 41);
        
        const result = await query(
            `UPDATE project_proposals SET plagiarism_score = $1, updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $2 RETURNING *`,
            [fakeScore, proposal_id]
        );
        
        if ((result as any[]).length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }
        
        res.json((result as any[])[0]);
    } catch (error) {
        console.error('Error in checkPlagiarism:', error);
        res.status(500).json({ error: 'Failed to check plagiarism' });
    }
};
