// Feature: protrack-auto-remaining-features, Property 1: Match_Score formula correctness
// Feature: protrack-auto-remaining-features, Property 2: Recommendation list invariants

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeMatchScore,
  rankGuides,
  type GuideCandidate,
} from '../services/allocationEngine.js';

// ─── Property 1: Match_Score formula correctness ────────────────────────────
// Note: When embeddingService is NOT ready (test environment), computeMatchScore
// falls back to the keyword intersection formula (Requirement 16.4).
describe('computeMatchScore', () => {
  it('Property 1: returns value matching the fallback formula for any valid inputs (embedding not ready)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 6 }),
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 6 }),
        fc.integer({ min: 0, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        async (expertiseTags, domainTags, cw, mw) => {
          fc.pre(cw <= mw);

          const score = await computeMatchScore(expertiseTags, domainTags, cw, mw);

          const intersection = expertiseTags.filter((t) =>
            domainTags.includes(t),
          ).length;
          const expected =
            (intersection / Math.max(1, domainTags.length)) *
            (1 - (cw / mw) * 0.3);

          return Math.abs(score - expected) < 1e-9;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns 0 when there is no tag overlap', async () => {
    expect(await computeMatchScore(['a', 'b'], ['c', 'd'], 0, 4)).toBe(0);
  });

  it('returns workload_factor when all domain tags match', async () => {
    const score = await computeMatchScore(['ml', 'ai'], ['ml', 'ai'], 1, 4);
    const expected = 1 - (1 / 4) * 0.3;
    expect(Math.abs(score - expected)).toBeLessThan(1e-9);
  });

  it('handles empty domain_tags (returns 0 overlap contribution)', async () => {
    const score = await computeMatchScore(['ml'], [], 0, 4);
    // intersection / max(1, 0) = 0 / 1 = 0; workload_factor irrelevant
    expect(score).toBe(0);
  });
});

// ─── Property 2: Recommendation list invariants ─────────────────────────────
describe('rankGuides', () => {
  const makeGuide = (
    id: string,
    expertise: string[],
    cw: number,
    mw: number,
  ): GuideCandidate => ({
    faculty_id: id,
    email: `${id}@test.com`,
    expertise_tags: expertise,
    current_workload: cw,
    max_workload: mw,
  });

  it('Property 2: returns ≤5 results, sorted desc by match_score, all scores in [0,1]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            faculty_id: fc.uuid(),
            email: fc.emailAddress(),
            expertise_tags: fc.array(
              fc.string({ minLength: 1, maxLength: 8 }),
              { maxLength: 5 },
            ),
            current_workload: fc.integer({ min: 0, max: 3 }),
            max_workload: fc.integer({ min: 1, max: 4 }),
          }),
          { maxLength: 10 },
        ),
        fc.array(fc.string({ minLength: 1, maxLength: 8 }), { maxLength: 5 }),
        async (guides, domainTags) => {
          // Ensure cw <= mw for each guide
          const validGuides = guides.map((g) => ({
            ...g,
            current_workload: Math.min(g.current_workload, g.max_workload),
          }));

          const results = await rankGuides(validGuides, domainTags);

          if (results.length > 5) return false;
          if (results.some((r) => r.match_score < 0 || r.match_score > 1))
            return false;

          for (let i = 1; i < results.length; i++) {
            if (results[i].match_score > results[i - 1].match_score)
              return false;
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('excludes guides at max workload', async () => {
    const guides = [
      makeGuide('g1', ['ml'], 4, 4), // at max — excluded
      makeGuide('g2', ['ml'], 2, 4), // eligible
    ];
    const results = await rankGuides(guides, ['ml']);
    expect(results).toHaveLength(1);
    expect(results[0].faculty_id).toBe('g2');
  });

  it('with empty domainTags: ranks by ascending current_workload', async () => {
    const guides = [
      makeGuide('g1', [], 3, 4),
      makeGuide('g2', [], 1, 4),
      makeGuide('g3', [], 2, 4),
    ];
    const results = await rankGuides(guides, []);
    expect(results.map((r) => r.faculty_id)).toEqual(['g2', 'g3', 'g1']);
  });

  it('returns empty list when no guides are eligible', async () => {
    const guides = [makeGuide('g1', ['ml'], 4, 4)];
    expect(await rankGuides(guides, ['ml'])).toHaveLength(0);
  });

  it('ties broken by ascending current_workload', async () => {
    // Same expertise → same score; lower workload should come first
    const guides = [
      makeGuide('g1', ['ml'], 3, 4),
      makeGuide('g2', ['ml'], 1, 4),
    ];
    const results = await rankGuides(guides, ['ml']);
    expect(results[0].faculty_id).toBe('g2');
  });
});
