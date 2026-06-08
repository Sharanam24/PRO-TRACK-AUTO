import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { generateMarksheetPDF, generateAttainmentPDF, MarksheetData, AttainmentReportData } from '../services/pdfService.js';
import { computeAttainment } from '../services/ml/attainmentService.js';
import { pool } from '../config/database.js';

/**
 * GET /api/reports/marksheet/:group_id
 * Generates and returns a PDF marksheet for a project group.
 */
export async function downloadMarksheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;

        // Fetch group info + members
        const groupRows = await query(
            `SELECT g.group_name, u.email as guide_email
             FROM project_groups g
             LEFT JOIN users u ON g.guide_id = u.user_id
             WHERE g.group_id = $1`,
            [group_id]
        );
        if (groupRows.length === 0) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const group = groupRows[0] as { group_name: string; guide_email: string | null };

        const memberRows = await query(
            `SELECT u.email, sp.prn_no, sp.roll_no
             FROM group_members gm
             JOIN users u ON gm.student_id = u.user_id
             JOIN student_profiles sp ON sp.student_id = u.user_id
             WHERE gm.group_id = $1`,
            [group_id]
        );

        // Fetch final results
        const resultsRows = await query(
            `SELECT r1_marks, r2_marks, r3_marks, final_phase_marks, final_marks, grade
             FROM final_results
             WHERE group_id = $1`,
            [group_id]
        );
        if (resultsRows.length === 0) {
            res.status(404).json({ error: 'No final results found for this group' });
            return;
        }
        const result = resultsRows[0] as {
            r1_marks: number | null;
            r2_marks: number | null;
            r3_marks: number | null;
            final_phase_marks: number | null;
            final_marks: number;
            grade: string;
        };

        const data: MarksheetData = {
            group_name: group.group_name,
            guide_email: group.guide_email,
            students: memberRows.map((m) => ({
                prn_no: (m as { prn_no: string }).prn_no,
                roll_no: (m as { roll_no: string }).roll_no,
                email: (m as { email: string }).email,
            })),
            ...result,
        };

        const pdfBuffer = await generateMarksheetPDF(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="marksheet-${group.group_name}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download marksheet error:', error);
        res.status(500).json({ error: 'Failed to generate marksheet' });
    }
}

/**
 * GET /api/reports/attainment?batch_year=2024&type=PO
 * Generates and returns a PDF PO/PSO attainment report.
 */
export async function downloadAttainmentReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const batchYear = parseInt(String(req.query.batch_year), 10);
        const type = String(req.query.type) as 'PO' | 'PSO';

        if (isNaN(batchYear) || !['PO', 'PSO'].includes(type)) {
            res.status(400).json({ error: 'batch_year (number) and type (PO|PSO) are required query params' });
            return;
        }

        const db = {
            async query(text: string, params?: unknown[]) {
                const result = await pool.query(text, params);
                return { rows: result.rows as Record<string, unknown>[] };
            },
        };

        const report = await computeAttainment(batchYear, type, db);

        const data: AttainmentReportData = {
            batch_year: report.batch_year,
            type: report.type,
            outcomes: report.outcomes,
            gaps: report.gaps,
            total_groups: report.total_groups,
        };

        const pdfBuffer = await generateAttainmentPDF(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="attainment-${type}-${batchYear}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download attainment report error:', error);
        res.status(500).json({ error: 'Failed to generate attainment report' });
    }
}
