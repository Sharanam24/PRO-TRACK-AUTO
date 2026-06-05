// Feature: protrack-audit-completion, Property: risk_level co-implication invariant
// Validates: Requirements 17.8, 20.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { classifyAtRisk, DbClient } from '../services/atRiskClassifier.js';

function makeMockDb(config: {
  logbooks: number;
  totalTasks: number;
  doneTasks: number;
  pastPhases: string[];
  evaluatedPhases: string[];
}): DbClient {
  return {
    async query(text: string, _params?: unknown[]) {
      if (text.includes('logbooks')) {
        return {
          rows: [{ count: String(config.logbooks), last_date: config.logbooks > 0 ? '2024-01-01' : null }],
        };
      }
      if (text.includes('tasks')) {
        return {
          rows: [{ total: String(config.totalTasks), done: String(config.doneTasks) }],
        };
      }
      if (text.includes('presentation_schedules')) {
        return {
          rows: config.pastPhases.map((phase) => ({ phase, presentation_time: '2020-01-01T00:00:00Z' })),
        };
      }
      if (text.includes('evaluations')) {
        return {
          rows: config.evaluatedPhases.map((phase) => ({ phase })),
        };
      }
      return { rows: [] };
    },
  };
}

// ─── Property: risk_level / isAtRisk co-implication invariant ────────────────
describe('classifyAtRisk – co-implication invariant', () => {
  it('Property: (CRITICAL || AT_RISK) === isAtRisk for all inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        fc.boolean(),
        async (logbooks, totalTasks, doneTasks, hasMissingEval) => {
          const mockDb = makeMockDb({
            logbooks,
            totalTasks,
            doneTasks,
            pastPhases: hasMissingEval ? ['PHASE1'] : [],
            evaluatedPhases: [],
          });
          const result = await classifyAtRisk('test-group', mockDb);
          return (
            (result.risk_level === 'CRITICAL' || result.risk_level === 'AT_RISK') === result.isAtRisk
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Unit tests ──────────────────────────────────────────────────────────────
describe('classifyAtRisk – unit tests', () => {
  it('CRITICAL: 0 logbooks + 20% tasks + missing eval', async () => {
    const mockDb = makeMockDb({ logbooks: 0, totalTasks: 10, doneTasks: 2, pastPhases: ['PHASE1'], evaluatedPhases: [] });
    const result = await classifyAtRisk('test-group', mockDb);
    expect(result.risk_level).toBe('CRITICAL');
    expect(result.isAtRisk).toBe(true);
  });

  it('AT_RISK: 0 logbooks only', async () => {
    const mockDb = makeMockDb({ logbooks: 0, totalTasks: 10, doneTasks: 8, pastPhases: [], evaluatedPhases: [] });
    const result = await classifyAtRisk('test-group', mockDb);
    expect(result.risk_level).toBe('AT_RISK');
    expect(result.isAtRisk).toBe(true);
  });

  it('ON_TRACK: 2 logbooks + 80% tasks', async () => {
    const mockDb = makeMockDb({ logbooks: 2, totalTasks: 10, doneTasks: 8, pastPhases: [], evaluatedPhases: [] });
    const result = await classifyAtRisk('test-group', mockDb);
    expect(result.risk_level).toBe('ON_TRACK');
    expect(result.isAtRisk).toBe(false);
  });

  it('recommendations is non-empty for AT_RISK', async () => {
    const mockDb = makeMockDb({ logbooks: 0, totalTasks: 10, doneTasks: 8, pastPhases: [], evaluatedPhases: [] });
    const result = await classifyAtRisk('test-group', mockDb);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('recommendations is non-empty for CRITICAL', async () => {
    const mockDb = makeMockDb({ logbooks: 0, totalTasks: 10, doneTasks: 2, pastPhases: ['P1'], evaluatedPhases: [] });
    const result = await classifyAtRisk('test-group', mockDb);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('recommendations is empty for ON_TRACK', async () => {
    const mockDb = makeMockDb({ logbooks: 3, totalTasks: 10, doneTasks: 9, pastPhases: [], evaluatedPhases: [] });
    const result = await classifyAtRisk('test-group', mockDb);
    expect(result.recommendations).toEqual([]);
  });
});
