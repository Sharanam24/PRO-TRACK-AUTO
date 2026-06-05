// Feature: protrack-audit-completion, Property: cosineSimilarity symmetry
// Feature: protrack-audit-completion, Property: cosineSimilarity identity
// Validates: Requirements 14.6, 14.7, 20.1, 20.6

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { cosineSimilarity, isReady, encodeBatch } from '../services/embeddingService.js';

// Inline L2-normalise helper used for the identity property test
function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

// ─── Property: cosineSimilarity symmetry ────────────────────────────────────
// Validates: Requirements 14.7, 20.6
describe('cosineSimilarity – symmetry', () => {
  it('Property: cosineSimilarity(a, b) === cosineSimilarity(b, a) for any pair of vectors', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 384 }),
        fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 384 }),
        (a, b) => {
          return Math.abs(cosineSimilarity(a, b) - cosineSimilarity(b, a)) < 1e-6;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property: cosineSimilarity identity ────────────────────────────────────
// Validates: Requirements 14.6, 20.1
describe('cosineSimilarity – identity', () => {
  it('Property: cosineSimilarity(norm, norm) ≈ 1.0 for any L2-normalised non-zero vector', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: Math.fround(0.001), max: 1, noNaN: true }), { minLength: 1, maxLength: 384 }),
        (v) => {
          const norm = normalize(v);
          return Math.abs(cosineSimilarity(norm, norm) - 1.0) < 1e-6;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Unit: isReady() returns boolean ────────────────────────────────────────
describe('isReady', () => {
  it('returns a boolean', () => {
    expect(typeof isReady()).toBe('boolean');
  });

  it('returns false before model initialisation in test environment', () => {
    expect(isReady()).toBe(false);
  });
});

// ─── Unit: encodeBatch ───────────────────────────────────────────────────────
describe('encodeBatch', () => {
  it('returns an array', async () => {
    const result = await encodeBatch(['hello', 'world']);
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns one entry per input text', async () => {
    const result = await encodeBatch(['a', 'b', 'c']);
    expect(result.length).toBe(3);
  });

  it('returns empty array entries when model is not ready', async () => {
    // Model never loaded in tests — each entry should be []
    const result = await encodeBatch(['hello']);
    expect(result[0]).toEqual([]);
  });

  it('handles empty input list', async () => {
    const result = await encodeBatch([]);
    expect(result).toEqual([]);
  });
});
