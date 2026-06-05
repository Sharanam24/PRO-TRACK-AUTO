import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { computeFinalMarks } from '../services/marksCalculator.js';
import { createNotification } from '../services/notificationService.js';
import { getRedisClient } from '../config/redis.js';

/** Invalidates attainment cache entries for a group's batch year */
async function invalidateAttainmentCache(groupId: string): Promise<void> {
    try {
        const redis = getRedisClient();
        if (!redis) return;
        const rows = await query(
            `SELECT batch_year FROM student_profiles sp
             JOIN group_members gm ON gm.student_id = sp.student_id
             WHERE gm.group_id = $1
             LIMIT 1`,
            [groupId]
        );
        if (rows.length === 0) return;
        const batchYear = (rows[0] as { batch_year: number }).batch_year;
        await Promise.all([
            redis.del(`attainment:${batchYear}:PO`),
            redis.del(`attainment:${batchYear}:PSO`),
        ]);
    } catch (err) {
        console.error('[evaluations] Cache invalidation error:', err);
    }
}

/** Notifies the group's guide that an evaluation was submitted */
async function notifyGuideOnEvaluation(groupId: string, phase: string): Promise<void> {
    try {
        const rows = await query(
            `SELECT g.guide_id FROM project_groups g WHERE g.group_id = $1 AND g.guide_id IS NOT NULL`,
            [groupId]
        );
        if (rows.length === 0) return;
        const guideId = (rows[0] as { guide_id: string }).guide_id;
        await createNotification({
            userId: guideId,
            title: `Evaluation Submitted: ${phase}`,
            message: `An evaluation for phase ${phase} has been submitted for your group.`,
            type: 'approval',
            priority: 'medium',
        });
    } catch (err) {
        console.error('Notify guide on evaluation error:', err);
    }
}

/** Recomputes and upserts final_results for a group after an evaluation change */
async function upsertFinalResults(groupId: string): Promise<void> {
    const rows = await query(
        `SELECT phase, total_marks FROM evaluations WHERE group_id = $1`,
        [groupId]
    );

    const phases: Record<string, number | null> = {
        REVIEW_1: null, REVIEW_2: null, REVIEW_3: null, FINAL: null
    };
    for (const row of rows) {
        phases[row.phase as string] = Number(row.total_marks);
    }

    const { finalMarks, grade } = computeFinalMarks(phases);

    await query(
        `INSERT INTO final_results
           (group_id, r1_marks, r2_marks, r3_marks, final_phase_marks, final_marks, grade, computed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (group_id) DO UPDATE
           SET r1_marks = EXCLUDED.r1_marks,
               r2_marks = EXCLUDED.r2_marks,
               r3_marks = EXCLUDED.r3_marks,
               final_phase_marks = EXCLUDED.final_phase_marks,
               final_marks = EXCLUDED.final_marks,
               grade = EXCLUDED.grade,
               computed_at = NOW()`,
        [
            groupId,
            phases.REVIEW_1,
            phases.REVIEW_2,
            phases.REVIEW_3,
            phases.FINAL,
            finalMarks,
            grade,
        ]
    );
}

// Submit a new evaluation
export async function submitEvaluation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id, phase, rubric_scores, total_marks } = req.body;

        if (!group_id || !phase || !rubric_scores || total_marks === undefined) {
            res.status(400).json({ error: 'group_id, phase, rubric_scores, and total_marks are required' });
            return;
        }

        // Validate phase
        const validPhases = ['REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL'];
        if (!validPhases.includes(phase)) {
            res.status(400).json({ error: `Invalid phase. Must be one of: ${validPhases.join(', ')}` });
            return;
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

        // Check if evaluation for this phase already exists
        const existing = await query(
            'SELECT eval_id FROM evaluations WHERE group_id = $1 AND phase = $2',
            [group_id, phase]
        );

        if (existing.length > 0) {
            // Update existing
            const result = await query(
                `UPDATE evaluations 
                 SET rubric_scores = $1, total_marks = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE group_id = $3 AND phase = $4
                 RETURNING eval_id, group_id, phase, rubric_scores, total_marks, updated_at`,
                [JSON.stringify(rubric_scores), total_marks, group_id, phase]
            );
            await upsertFinalResults(group_id as string);
            await notifyGuideOnEvaluation(group_id as string, phase as string);
            await invalidateAttainmentCache(group_id as string);
            res.status(200).json({
                message: 'Evaluation updated successfully',
                evaluation: result[0]
            });
            return;
        }

        // Create new
        const result = await query(
            `INSERT INTO evaluations (group_id, phase, rubric_scores, total_marks) 
             VALUES ($1, $2, $3, $4)
             RETURNING eval_id, group_id, phase, rubric_scores, total_marks, created_at`,
            [group_id, phase, JSON.stringify(rubric_scores), total_marks]
        );
        await upsertFinalResults(group_id as string);
        await notifyGuideOnEvaluation(group_id as string, phase as string);
        await invalidateAttainmentCache(group_id as string);

        res.status(201).json({
            message: 'Evaluation submitted successfully',
            evaluation: result[0]
        });
    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.status(500).json({ error: 'Failed to submit evaluation' });
    }
}

// Get evaluations
export async function getEvaluations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.query;
        let sql = `
            SELECT e.eval_id, e.group_id, e.phase, e.rubric_scores, e.total_marks, e.created_at, e.updated_at,
                   g.group_name
            FROM evaluations e
            JOIN project_groups g ON e.group_id = g.group_id
        `;
        const params: any[] = [];

        if (group_id) {
            sql += ' WHERE e.group_id = $1';
            params.push(group_id);
        }

        sql += ' ORDER BY e.created_at DESC';

        const evaluations = await query(sql, params);
        res.status(200).json(evaluations);
    } catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ error: 'Failed to fetch evaluations' });
    }
}

// Get final results for a group (Requirement 4.6)
export async function getResults(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { groupId } = req.params;

        const rows = await query(
            `SELECT result_id, group_id, r1_marks, r2_marks, r3_marks,
                    final_phase_marks, final_marks, grade, computed_at
             FROM final_results
             WHERE group_id = $1`,
            [groupId]
        );

        if (rows.length === 0) {
            res.status(404).json({ error: 'No results found for this group' });
            return;
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch final results' });
    }
}
