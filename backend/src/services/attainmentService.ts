/**
 * Attainment Service — computes PO/PSO attainment from evaluation rubric scores.
 * Requirements: 13.1–13.5, 18.1–18.5
 */

export interface AttainmentReport {
    outcomes: Record<string, number>;
    gaps: string[];
    total_groups: number;
    batch_year: number;
    type: string;
}

export interface DbClient {
    query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/**
 * Attainment gap threshold — outcomes below this % are reported as gaps.
 * Configurable via PO_ATTAINMENT_THRESHOLD env var (default 60).
 */
export const GAP_THRESHOLD = parseFloat(process.env.PO_ATTAINMENT_THRESHOLD ?? '60');

/**
 * Compute attainment for a single outcome given achieved and max weighted values.
 * Exported for unit testing (Requirement 20.4).
 * Formula: (achieved_weighted / max_weighted) * 100, clamped to [0, 100].
 */
export function computeSingleOutcomeAttainment(
    achievedSum: number,
    maxSum: number,
    _level: number,
): number {
    if (maxSum <= 0) return 0;
    const raw = (achievedSum / maxSum) * 100;
    return Math.min(100, Math.max(0, parseFloat(raw.toFixed(2))));
}

/**
 * Computes PO or PSO attainment percentages for all outcomes in a given batch year.
 * Returns 0.00 for every outcome when no evaluation data exists (Requirement 18.4).
 *
 * @param batchYear  - Academic batch year (e.g. 2024)
 * @param type       - 'PO' or 'PSO'
 * @param db         - DB client (injectable for testing)
 */
export async function computeAttainment(
    batchYear: number,
    type: 'PO' | 'PSO',
    db: DbClient,
): Promise<AttainmentReport> {
    const mappingRows = await db.query(
        `SELECT criteria_id, outcome_id, level
         FROM po_pso_mappings
         WHERE mapping_type = $1 AND batch_year = $2`,
        [type, batchYear]
    );

    if (mappingRows.rows.length === 0) {
        return { outcomes: {}, gaps: [], total_groups: 0, batch_year: batchYear, type };
    }

    const criteriaToOutcomes = new Map<string, { outcome_id: string; level: number }[]>();
    for (const row of mappingRows.rows) {
        const r = row as { criteria_id: string; outcome_id: string; level: number };
        if (!criteriaToOutcomes.has(r.criteria_id)) {
            criteriaToOutcomes.set(r.criteria_id, []);
        }
        criteriaToOutcomes.get(r.criteria_id)!.push({ outcome_id: r.outcome_id, level: r.level });
    }

    const allOutcomes = new Set<string>();
    for (const mappings of criteriaToOutcomes.values()) {
        for (const m of mappings) allOutcomes.add(m.outcome_id);
    }

    const evalRows = await db.query(
        `SELECT e.rubric_scores, e.group_id
         FROM evaluations e
         JOIN project_groups pg ON e.group_id = pg.group_id
         WHERE pg.batch_year = $1`,
        [batchYear]
    );

    const groupSet = new Set(evalRows.rows.map((r) => (r as { group_id: string }).group_id));
    const totalGroups = groupSet.size;

    const achievedMap: Record<string, number> = {};
    const maxMap: Record<string, number> = {};
    for (const outcome of allOutcomes) {
        achievedMap[outcome] = 0;
        maxMap[outcome] = 0;
    }

    for (const row of evalRows.rows) {
        const rubricScores = (row as { rubric_scores: Record<string, number> | null }).rubric_scores;
        if (!rubricScores) continue;

        for (const [criteriaId, score] of Object.entries(rubricScores)) {
            const mappings = criteriaToOutcomes.get(criteriaId);
            if (!mappings) continue;
            const maxScore = 100;
            for (const { outcome_id, level } of mappings) {
                achievedMap[outcome_id] += (score as number) * level;
                maxMap[outcome_id] += maxScore * level;
            }
        }
    }

    // Compute final attainment per outcome (Requirement 18.2, 18.3)
    const outcomes: Record<string, number> = {};
    const gaps: string[] = [];

    for (const outcome of allOutcomes) {
        const attainment = maxMap[outcome] > 0
            ? parseFloat(((achievedMap[outcome] / maxMap[outcome]) * 100).toFixed(2))
            : 0.00;
        outcomes[outcome] = Math.min(100, Math.max(0, attainment)); // Req 18.5
        if (outcomes[outcome] < GAP_THRESHOLD) {
            gaps.push(outcome);
        }
    }

    return { outcomes, gaps, total_groups: totalGroups, batch_year: batchYear, type };
}
