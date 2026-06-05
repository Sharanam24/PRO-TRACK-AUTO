import { Response } from 'express';
import { query, pool } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * GET /api/mappings?batch_year=<year>&type=PO|PSO
 * Returns the mapping matrix as { [criteria_id]: { [outcome_id]: level } }
 * Defaults to empty object (all levels 0) when no rows exist (Requirement 3.4).
 */
export async function getMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { batch_year, type } = req.query;

        if (!batch_year || !type) {
            res.status(400).json({ error: 'batch_year and type query parameters are required' });
            return;
        }

        const rows = await query(
            `SELECT criteria_id, outcome_id, level
             FROM po_pso_mappings
             WHERE batch_year = $1 AND mapping_type = $2`,
            [batch_year, type]
        );

        // Reshape to { criteria_id: { outcome_id: level } }
        const matrix: Record<string, Record<string, number>> = {};
        for (const row of rows) {
            const criteriaId = row.criteria_id as string;
            const outcomeId = row.outcome_id as string;
            const level = Number(row.level);
            if (!matrix[criteriaId]) matrix[criteriaId] = {};
            matrix[criteriaId]![outcomeId] = level;
        }

        res.status(200).json({ batch_year, type, mappings: matrix });
    } catch (error) {
        console.error('Get mappings error:', error);
        res.status(500).json({ error: 'Failed to fetch mappings' });
    }
}

interface MappingRow {
    criteria_id: string;
    outcome_id: string;
    level: number;
}

/**
 * POST /api/mappings — COORDINATOR only
 * Body: { batch_year: number, type: 'PO'|'PSO', mappings: { [criteria_id]: { [outcome_id]: level } } }
 * Validates levels are integers in [0,3], then upserts in a single transaction (Requirement 3.2).
 */
export async function saveMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { batch_year, type, mappings } = req.body as {
            batch_year: number;
            type: string;
            mappings: Record<string, Record<string, number>>;
        };

        if (!batch_year || !type || !mappings) {
            res.status(400).json({ error: 'batch_year, type, and mappings are required' });
            return;
        }

        if (!['PO', 'PSO'].includes(type)) {
            res.status(400).json({ error: 'type must be PO or PSO' });
            return;
        }

        // Flatten and validate (Requirement 3.5)
        const rows: MappingRow[] = [];
        const details: { field: string; message: string }[] = [];

        for (const [criteriaId, outcomes] of Object.entries(mappings)) {
            for (const [outcomeId, level] of Object.entries(outcomes)) {
                if (!Number.isInteger(level) || level < 0 || level > 3) {
                    details.push({
                        field: `mappings.${criteriaId}.${outcomeId}`,
                        message: `Level must be an integer between 0 and 3, got ${level}`,
                    });
                } else {
                    rows.push({ criteria_id: criteriaId, outcome_id: outcomeId, level });
                }
            }
        }

        if (details.length > 0) {
            res.status(422).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const userId = req.user?.user_id;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const row of rows) {
                await client.query(
                    `INSERT INTO po_pso_mappings
                       (mapping_type, criteria_id, outcome_id, level, batch_year, created_by, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())
                     ON CONFLICT (mapping_type, criteria_id, outcome_id, batch_year)
                     DO UPDATE SET level = EXCLUDED.level,
                                   updated_at = NOW()`,
                    [type, row.criteria_id, row.outcome_id, row.level, batch_year, userId ?? null]
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        res.status(200).json({ success: true, saved: rows.length });
    } catch (error) {
        console.error('Save mappings error:', error);
        res.status(500).json({ error: 'Failed to save mappings' });
    }
}
