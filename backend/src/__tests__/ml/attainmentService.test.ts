// Feature: protrack-audit-completion, Property: attainment bounded [0,100]
// Validates: Requirements 20.4, 18.5

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeAttainment,
  computeSingleOutcomeAttainment,
  DbClient,
} from '../../services/ml/attainmentService.js';

// ─── Mock DB helper ──────────────────────────────────────────────────────────
/**
 * Creates a mock DbClient that routes queries based on SQL substrings.
 * The service makes two queries:
 *   1. SELECT ... FROM po_pso_mappings ...
 *   2. SELECT e.rubric_scores, e.group_id FROM evaluations e JOIN project_groups ...
 */
function makeMockDb(config: {
  mappingRows: Array<{ criteria_id: string; outcome_id: string; level: number }>;
  evalRows: Array<{ rubric_scores: Record<string, number> | null; group_id: string }>;
}): DbClient {
  return {
    async query(text: string, _params?: unknown[]) {
      if (text.includes('po_pso_mappings')) {
        return { rows: config.mappingRows };
      }
      if (text.includes('evaluations')) {
        return { rows: config.evalRows };
      }
      return { rows: [] };
    },
  };
}

// ─── Property: attainment bounded [0,100] ────────────────────────────────────
// Validates: Requirements 20.4, 18.5
describe('computeSingleOutcomeAttainment – bounded invariant', () => {
  it(
    'Property: attainment is always in [0, 100] for any achieved/max/level inputs',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),   // achieved score
          fc.integer({ min: 1, max: 100 }),   // max score (must be >= 1 to avoid div-by-zero path)
          fc.integer({ min: 0, max: 3 }),     // mapping level
          (achieved, maxScore, level) => {
            const att = computeSingleOutcomeAttainment(
              achieved * level,
              maxScore * level,
              level,
            );
            return att >= 0 && att <= 100;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it('Property: maxSum = 0 returns 0 (no division by zero)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (achieved) => {
          const att = computeSingleOutcomeAttainment(achieved, 0, 1);
          return att === 0;
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ─── Unit: correct computation ───────────────────────────────────────────────
describe('computeAttainment – correct computation', () => {
  it('single evaluation: rubric_scores={c1:80}, max 100, level 2 → PO1 = 80.00', async () => {
    // Formula: (80 × 2) / (100 × 2) × 100 = 160 / 200 × 100 = 80.00
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 2 }],
      evalRows: [{ rubric_scores: { c1: 80 }, group_id: 'g1' }],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);

    expect(result.outcomes['PO1']).toBeDefined();
    expect(result.outcomes['PO1']).toBe(80.00);
  });

  it('score 50/100 with level 3 → PO1 = 50.00', async () => {
    // Formula: (50 × 3) / (100 × 3) × 100 = 150/300 × 100 = 50.00
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 3 }],
      evalRows: [{ rubric_scores: { c1: 50 }, group_id: 'g1' }],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.outcomes['PO1']).toBe(50.00);
  });

  it('two evaluations for same outcome → averages correctly', async () => {
    // Group g1: c1=60, Group g2: c1=80; level=1
    // achievedSum = (60×1) + (80×1) = 140, maxSum = 100+100 = 200
    // attainment = 140/200 × 100 = 70.00
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 1 }],
      evalRows: [
        { rubric_scores: { c1: 60 }, group_id: 'g1' },
        { rubric_scores: { c1: 80 }, group_id: 'g2' },
      ],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.outcomes['PO1']).toBe(70.00);
  });

  it('total_groups reflects distinct groups in evaluations', async () => {
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 1 }],
      evalRows: [
        { rubric_scores: { c1: 90 }, group_id: 'g1' },
        { rubric_scores: { c1: 70 }, group_id: 'g1' }, // same group, two evals
        { rubric_scores: { c1: 80 }, group_id: 'g2' },
      ],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.total_groups).toBe(2);
  });
});

// ─── Unit: no data returns 0 ─────────────────────────────────────────────────
describe('computeAttainment – no data returns 0', () => {
  it('empty evaluations → outcomes map is empty (no error thrown)', async () => {
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 2 }],
      evalRows: [],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    // PO1 is in outcomes but should be 0.00 since no evaluation data
    expect(result.outcomes['PO1']).toBe(0.00);
    expect(result.gaps).toContain('PO1'); // 0 < 60 threshold → appears in gaps
  });

  it('null rubric_scores in evaluations → outcome returns 0.00', async () => {
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 1 }],
      evalRows: [{ rubric_scores: null, group_id: 'g1' }],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.outcomes['PO1']).toBe(0.00);
  });

  it('no mapping rows → returns empty outcomes object with no error', async () => {
    const mockDb = makeMockDb({
      mappingRows: [],
      evalRows: [{ rubric_scores: { c1: 80 }, group_id: 'g1' }],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.outcomes).toEqual({});
    expect(result.gaps).toEqual([]);
    expect(result.total_groups).toBe(0);
  });
});

// ─── Unit: gap identification ─────────────────────────────────────────────────
describe('computeAttainment – gap identification', () => {
  it('outcome with attainment 45% appears in gaps (below 60% threshold)', async () => {
    // 45/100 × 100 = 45.00
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 1 }],
      evalRows: [{ rubric_scores: { c1: 45 }, group_id: 'g1' }],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.outcomes['PO1']).toBe(45.00);
    expect(result.gaps).toContain('PO1');
  });

  it('outcome with attainment 80% does NOT appear in gaps', async () => {
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 1 }],
      evalRows: [{ rubric_scores: { c1: 80 }, group_id: 'g1' }],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.outcomes['PO1']).toBe(80.00);
    expect(result.gaps).not.toContain('PO1');
  });

  it('outcome exactly at 60% threshold does NOT appear in gaps', async () => {
    const mockDb = makeMockDb({
      mappingRows: [{ criteria_id: 'c1', outcome_id: 'PO1', level: 1 }],
      evalRows: [{ rubric_scores: { c1: 60 }, group_id: 'g1' }],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.outcomes['PO1']).toBe(60.00);
    expect(result.gaps).not.toContain('PO1');
  });

  it('multiple outcomes: gap and non-gap correctly separated', async () => {
    const mockDb = makeMockDb({
      mappingRows: [
        { criteria_id: 'c1', outcome_id: 'PO1', level: 1 },
        { criteria_id: 'c2', outcome_id: 'PO2', level: 1 },
      ],
      evalRows: [
        // c1=45 → PO1=45% (gap), c2=80 → PO2=80% (no gap)
        { rubric_scores: { c1: 45, c2: 80 }, group_id: 'g1' },
      ],
    });

    const result = await computeAttainment(2024, 'PO', mockDb);
    expect(result.gaps).toContain('PO1');
    expect(result.gaps).not.toContain('PO2');
  });
});
