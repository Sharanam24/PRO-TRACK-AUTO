// Feature: protrack-auto-remaining-features, Property 5: Grade derivation correctness
// Feature: protrack-auto-remaining-features, Property 9: Final_Marks formula is correct and bounded

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeFinalMarks,
  deriveGrade,
  PHASE_WEIGHTS,
} from '../services/marksCalculator.js';

// ─── Property 5: Grade derivation correctness ───────────────────────────────
describe('deriveGrade', () => {
  it('Property 5: returns correct grade letter for any mark in [0, 100]', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (marks) => {
        const grade = deriveGrade(marks);
        if (marks >= 90) return grade === 'O';
        if (marks >= 80) return grade === 'A+';
        if (marks >= 70) return grade === 'A';
        if (marks >= 60) return grade === 'B+';
        if (marks >= 50) return grade === 'B';
        if (marks >= 40) return grade === 'C';
        return grade === 'F';
      }),
      { numRuns: 200 },
    );
  });

  it('boundary: 90 → O', () => expect(deriveGrade(90)).toBe('O'));
  it('boundary: 89.9 → A+', () => expect(deriveGrade(89.9)).toBe('A+'));
  it('boundary: 80 → A+', () => expect(deriveGrade(80)).toBe('A+'));
  it('boundary: 40 → C', () => expect(deriveGrade(40)).toBe('C'));
  it('boundary: 39.9 → F', () => expect(deriveGrade(39.9)).toBe('F'));
  it('boundary: 0 → F', () => expect(deriveGrade(0)).toBe('F'));
  it('boundary: 100 → O', () => expect(deriveGrade(100)).toBe('O'));
});

// ─── Property 9: Final_Marks formula is correct and bounded ─────────────────
describe('computeFinalMarks', () => {
  const phases = ['REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL'] as const;

  it('Property 9: any subset of phases yields finalMarks in [0,100] equal to weighted normalised average', () => {
    fc.assert(
      fc.property(
        fc.record({
          REVIEW_1: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
          REVIEW_2: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
          REVIEW_3: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
          FINAL: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
        }),
        (input) => {
          const { finalMarks } = computeFinalMarks(input);

          if (finalMarks < 0 || finalMarks > 100) return false;

          let weightedSum = 0;
          let totalWeight = 0;
          for (const phase of phases) {
            const marks = input[phase];
            if (marks === null) continue;
            const w = PHASE_WEIGHTS[phase]!;
            weightedSum += marks * w;
            totalWeight += w;
          }
          const expected = totalWeight === 0 ? 0 : weightedSum / totalWeight;

          return Math.abs(finalMarks - expected) < 1e-6;
        },
      ),
      { numRuns: 200 },
    );
  });

  it('all phases: (80*0.15 + 70*0.20 + 90*0.25 + 85*0.40) / 1.0 = 82.5', () => {
    const { finalMarks, grade } = computeFinalMarks({ REVIEW_1: 80, REVIEW_2: 70, REVIEW_3: 90, FINAL: 85 });
    expect(Math.abs(finalMarks - 82.5)).toBeLessThan(1e-6);
    expect(grade).toBe('A+');
  });

  it('single phase returns that phase marks', () => {
    const { finalMarks } = computeFinalMarks({ REVIEW_1: 60, REVIEW_2: null, REVIEW_3: null, FINAL: null });
    expect(Math.abs(finalMarks - 60)).toBeLessThan(1e-6);
  });

  it('no phases → 0 and F', () => {
    const { finalMarks, grade } = computeFinalMarks({ REVIEW_1: null, REVIEW_2: null, REVIEW_3: null, FINAL: null });
    expect(finalMarks).toBe(0);
    expect(grade).toBe('F');
  });

  it('caps marks over 100', () => {
    const { finalMarks } = computeFinalMarks({ REVIEW_1: 120, REVIEW_2: null, REVIEW_3: null, FINAL: null });
    expect(finalMarks).toBe(100);
  });
});
