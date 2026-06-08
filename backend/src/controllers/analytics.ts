import { Response } from 'express';
import { query, pool } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { classifyAtRisk, DbClient } from '../services/ml/atRiskClassifier.js';
import { withCache } from '../config/redis.js';
import { computeAttainment } from '../services/ml/attainmentService.js';

export const getGuideAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const guide_id = req.user?.user_id;

        const result = await query(
            `SELECT 
                g.group_id, g.group_name, g.status,
                COUNT(DISTINCT m.student_id) as member_count,
                COUNT(DISTINCT l.log_id) as logbook_count,
                COUNT(DISTINCT t.task_id) as task_count
             FROM project_groups g
             LEFT JOIN group_members m ON g.group_id = m.group_id
             LEFT JOIN logbooks l ON g.group_id = l.group_id
             LEFT JOIN tasks t ON g.group_id = t.group_id
             WHERE g.guide_id = $1
             GROUP BY g.group_id`,
            [guide_id]
        );

        res.json(result);
    } catch (error) {
        console.error('Error fetching guide analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

/** Build a DbClient wrapper around pool for use with classifyAtRisk */
function makeDbClient(): DbClient {
    return {
        async query(text: string, params?: unknown[]) {
            const result = await pool.query(text, params);
            return { rows: result.rows as Record<string, unknown>[] };
        },
    };
}

// GET /api/analytics/coordinator/dashboard
export async function getCoordinatorDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const data = await withCache('analytics:dashboard', 300, async () => {
            const db = makeDbClient();

            // Total active groups
            const groupRows = await query(
                `SELECT group_id FROM project_groups WHERE status = 'ACTIVE'`
            );
            const totalActiveGroups = groupRows.length;

            // Average final marks
            const marksRows = await query(
                `SELECT AVG(final_marks) as avg_final_marks FROM final_results`
            );
            const avgFinalMarks = marksRows[0]
                ? parseFloat(String(marksRows[0].avg_final_marks ?? 0))
                : 0;

            // At-risk count
            let atRiskCount = 0;
            for (const g of groupRows) {
                const result = await classifyAtRisk(g.group_id as string, db);
                if (result.isAtRisk) atRiskCount++;
            }

            // Per-guide workload table
            const guideRows = await query(
                `SELECT f.faculty_id, u.email, f.current_workload, f.max_workload
                 FROM faculty_profiles f
                 JOIN users u ON f.faculty_id = u.user_id`
            );

            return {
                total_active_groups: totalActiveGroups,
                avg_final_marks: avgFinalMarks,
                at_risk_count: atRiskCount,
                guide_workload: guideRows,
            };
        });

        res.status(200).json(data);
    } catch (error) {
        console.error('Coordinator dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch coordinator dashboard' });
    }
}

// GET /api/analytics/coordinator/trends
export async function getPerformanceTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const data = await withCache('analytics:trends', 300, async () => {
            const rows = await query(
                `SELECT
                    EXTRACT(WEEK FROM created_at)::int as week_number,
                    AVG(total_marks) as avg_total_marks,
                    COUNT(*) as eval_count
                 FROM evaluations
                 GROUP BY week_number
                 ORDER BY week_number ASC`
            );
            return rows.length > 0 ? rows : [];
        });

        res.status(200).json(data);
    } catch (error) {
        console.error('Performance trends error:', error);
        res.status(500).json({ error: 'Failed to fetch performance trends' });
    }
}

// GET /api/analytics/coordinator/guide-distribution
export async function getGuideDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = makeDbClient();

        const guideRows = await query(
            `SELECT f.faculty_id, u.email, f.current_workload, f.max_workload
             FROM faculty_profiles f
             JOIN users u ON f.faculty_id = u.user_id`
        );

        const result = await Promise.all(
            guideRows.map(async (guide) => {
                const facultyId = guide.faculty_id as string;

                // Avg marks of assigned groups
                const marksRows = await query(
                    `SELECT AVG(fr.final_marks) as avg_marks
                     FROM final_results fr
                     JOIN project_groups g ON fr.group_id = g.group_id
                     WHERE g.guide_id = $1`,
                    [facultyId]
                );
                const avgMarks = marksRows[0]
                    ? parseFloat(String(marksRows[0].avg_marks ?? 0))
                    : 0;

                // Count at-risk groups under this guide
                const assignedGroups = await query(
                    `SELECT group_id FROM project_groups WHERE guide_id = $1 AND status = 'ACTIVE'`,
                    [facultyId]
                );
                let atRiskCount = 0;
                for (const g of assignedGroups) {
                    const risk = await classifyAtRisk(g.group_id as string, db);
                    if (risk.isAtRisk) atRiskCount++;
                }

                return {
                    email: guide.email,
                    current_workload: guide.current_workload,
                    max_workload: guide.max_workload,
                    avg_marks: avgMarks,
                    at_risk_count: atRiskCount,
                };
            })
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Guide distribution error:', error);
        res.status(500).json({ error: 'Failed to fetch guide distribution' });
    }
}

// GET /api/analytics/coordinator/at-risk
export async function getAtRiskGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = makeDbClient();

        const groups = await query(
            `SELECT g.group_id, g.group_name,
                    u.email as guide_email,
                    COUNT(gm.student_id) as member_count
             FROM project_groups g
             LEFT JOIN users u ON g.guide_id = u.user_id
             LEFT JOIN group_members gm ON g.group_id = gm.group_id
             WHERE g.status = 'ACTIVE'
             GROUP BY g.group_id, u.email`
        );

        const atRiskGroups = [];
        for (const group of groups) {
            const groupId = group.group_id as string;
            const risk = await classifyAtRisk(groupId, db);
            if (risk.isAtRisk) {
                atRiskGroups.push({
                    group_id: groupId,
                    group_name: group.group_name,
                    guide_email: group.guide_email ?? null,
                    member_count: Number(group.member_count),
                    last_logbook_date: risk.lastLogbookDate,
                    task_completion_pct: risk.taskCompletionPct,
                    reasons: risk.reasons,
                    risk_level: risk.risk_level,
                });
            }
        }

        res.status(200).json(atRiskGroups);
    } catch (error) {
        console.error('At-risk groups error:', error);
        res.status(500).json({ error: 'Failed to fetch at-risk groups' });
    }
}

// GET /api/analytics/attainment?batch_year=&type=PO|PSO
export async function getAttainment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const batchYear = parseInt(String(req.query.batch_year), 10);
        const type = String(req.query.type) as 'PO' | 'PSO';

        if (isNaN(batchYear) || !['PO', 'PSO'].includes(type)) {
            res.status(400).json({ error: 'batch_year (number) and type (PO|PSO) are required query params' });
            return;
        }

        const db = makeDbClient();

        const data = await withCache(`attainment:${batchYear}:${type}`, 300, async () => {
            // Check if any mappings exist first
            const mappingCheck = await query(
                `SELECT 1 FROM po_pso_mappings WHERE mapping_type = $1 AND batch_year = $2 LIMIT 1`,
                [type, batchYear]
            );
            if (mappingCheck.length === 0) {
                return null;
            }
            return computeAttainment(batchYear, type, db);
        });

        if (data === null) {
            res.status(404).json({ error: 'No mapping data found for the specified batch year and type', code: 'NO_MAPPING_DATA' });
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Attainment error:', error);
        res.status(500).json({ error: 'Failed to compute attainment' });
    }
}
