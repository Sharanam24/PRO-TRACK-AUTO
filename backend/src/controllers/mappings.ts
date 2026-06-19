import { Response } from 'express';
import { query, pool } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * GET /api/mappings?type=PO|PSO
 */
export async function getMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { type } = req.query;

        if (!type) {
            res.status(400).json({ error: 'type query parameter is required' });
            return;
        }

        const rows = await query(
            `SELECT criterion_id, outcome_key, level
             FROM po_pso_mappings
             WHERE mapping_type = $1`,
            [type]
        );

        const matrix: Record<string, Record<string, number>> = {};
        for (const row of rows) {
            const cid = String(row.criterion_id);
            const oid = String(row.outcome_key);
            const level = Number(row.level);
            if (!matrix[cid]) matrix[cid] = {};
            matrix[cid]![oid] = level;
        }

        res.status(200).json({ type, mappings: matrix });
    } catch (error) {
        console.error('Get mappings error:', error);
        res.status(500).json({ error: 'Failed to fetch mappings' });
    }
}

/**
 * POST /api/mappings — COORDINATOR only
 * Body: { mapping_type: 'PO'|'PSO', mappings: { [criterion_id]: { [outcome_key]: level } } }
 */
export async function saveMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { mapping_type, mappings } = req.body as {
            mapping_type: string;
            mappings: Record<string, Record<string, number>>;
        };

        if (!mapping_type || !mappings) {
            res.status(400).json({ error: 'mapping_type and mappings are required' });
            return;
        }

        if (!['PO', 'PSO'].includes(mapping_type)) {
            res.status(400).json({ error: 'mapping_type must be PO or PSO' });
            return;
        }

        const rows: { criterion_id: string; outcome_key: string; level: number }[] = [];
        const details: { field: string; message: string }[] = [];

        for (const [criterionId, outcomes] of Object.entries(mappings)) {
            for (const [outcomeKey, level] of Object.entries(outcomes)) {
                const numLevel = Number(level);
                if (!Number.isInteger(numLevel) || numLevel < 0 || numLevel > 3) {
                    details.push({
                        field: `mappings.${criterionId}.${outcomeKey}`,
                        message: `Level must be 0-3, got ${level}`,
                    });
                } else {
                    rows.push({ criterion_id: criterionId, outcome_key: outcomeKey, level: numLevel });
                }
            }
        }

        if (details.length > 0) {
            res.status(422).json({ error: 'Validation failed', details });
            return;
        }

        const userId = req.user?.user_id;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            for (const row of rows) {
                await client.query(
                    `INSERT INTO po_pso_mappings (mapping_type, criterion_id, outcome_key, level, updated_by, updated_at)
                     VALUES ($1, $2, $3, $4, $5, NOW())
                     ON CONFLICT (criterion_id, mapping_type, outcome_key)
                     DO UPDATE SET level = EXCLUDED.level, updated_at = NOW()`,
                    [mapping_type, row.criterion_id, row.outcome_key, row.level, userId ?? null]
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
