/**
 * Allocation Engine — pure functions for guide-to-project matching.
 * Implements the scoring formula from Requirement 1.2.
 */

import {
  isReady,
  embed,
  cosineSimilarity,
} from './embeddingService.js';

export interface GuideCandidate {
  faculty_id: string;
  email: string;
  expertise_tags: string[];
  current_workload: number;
  max_workload: number;
}

export interface RankedGuide extends GuideCandidate {
  match_score: number;
}

/**
 * Computes a match score in [0, 1] for a guide candidate against a project's domain tags.
 *
 * When the embedding service is ready (Requirement 16.1):
 *   similarity = cosineSimilarity(embed(expertiseTags.join(' ')), embed(domainTags.join(' ')))
 *   domainBoost = sharesDomainTag ? 0.1 : 0  (Requirement 16.2)
 *   score = clamp(similarity + domainBoost, 0, 1)  (Requirement 16.3)
 *
 * Fallback when embedding service is not ready (Requirement 16.4):
 *   score = (|intersection(expertise_tags, domain_tags)| / max(1, |domain_tags|))
 *           × workload_factor
 *   workload_factor = 1 - (current_workload / max_workload) × 0.3
 *
 * @param expertiseTags  - The guide's expertise keyword tags
 * @param domainTags     - The project's domain keyword tags
 * @param currentWorkload - Guide's current number of supervised groups
 * @param maxWorkload     - Guide's maximum allowed supervised groups (must be ≥ 1)
 * @returns A promise resolving to a number in [0, 1]
 */
export async function computeMatchScore(
  expertiseTags: string[],
  domainTags: string[],
  currentWorkload: number,
  maxWorkload: number,
): Promise<number> {
  const workloadFactor = 1 - (currentWorkload / maxWorkload) * 0.3;

  if (isReady()) {
    // Requirements 16.1, 19.2: semantic similarity via embeddings
    const expertiseText = expertiseTags.join(' ');
    const domainText = domainTags.join(' ');

    const [expertiseVec, domainVec] = await Promise.all([
      embed(expertiseText),
      embed(domainText),
    ]);

    const similarity = cosineSimilarity(expertiseVec, domainVec);

    // Requirement 16.2: domain boost when guide and project share at least one tag exactly
    const sharesDomainTag = expertiseTags.some((tag) =>
      domainTags.includes(tag),
    );
    const domainBoost = sharesDomainTag ? 0.1 : 0;

    // Requirement 16.3: clamp to [0, 1]
    return Math.min(1, Math.max(0, similarity + domainBoost));
  }

  // Requirement 16.4: fallback to keyword intersection formula
  const intersectionSize = expertiseTags.filter((tag) =>
    domainTags.includes(tag),
  ).length;

  const overlapRatio = intersectionSize / Math.max(1, domainTags.length);

  return overlapRatio * workloadFactor;
}

/**
 * Ranks guide candidates for a given project and returns at most 5 results.
 *
 * Sorting rules (Requirements 1.3, 1.4, 1.9):
 * - When domainTags is non-empty: sort descending by match_score; ties broken by
 *   ascending current_workload.
 * - When domainTags is empty: rank purely by ascending current_workload (Requirement 1.9).
 *
 * Only guides whose current_workload < max_workload are considered (Requirement 1.1).
 * Every match_score in the result is guaranteed to be in [0, 1] (Requirement 1.8).
 * Returns at most 5 ranked results (Requirement 16.5).
 *
 * @param guides     - Pool of guide candidates
 * @param domainTags - Project domain tags (may be empty)
 * @returns Promise resolving to sorted list of at most 5 RankedGuide entries
 */
export async function rankGuides(
  guides: GuideCandidate[],
  domainTags: string[],
): Promise<RankedGuide[]> {
  // Requirement 1.1: only eligible guides (not at max workload)
  const eligible = guides.filter(
    (g) => g.current_workload < g.max_workload,
  );

  if (domainTags.length === 0) {
    // Requirement 1.9: empty domain tags → rank purely by ascending workload
    const sorted = [...eligible].sort(
      (a, b) => a.current_workload - b.current_workload,
    );
    const top5 = sorted.slice(0, 5);
    const scored = await Promise.all(
      top5.map(async (g) => ({
        ...g,
        match_score: await computeMatchScore(
          g.expertise_tags,
          domainTags,
          g.current_workload,
          g.max_workload,
        ),
      })),
    );
    return scored;
  }

  // Score every eligible guide (Requirements 16.1, 19.2: embed() called here)
  const scored: RankedGuide[] = await Promise.all(
    eligible.map(async (g) => ({
      ...g,
      match_score: await computeMatchScore(
        g.expertise_tags,
        domainTags,
        g.current_workload,
        g.max_workload,
      ),
    })),
  );

  // Requirements 1.3, 1.4: descending score; ties → ascending workload
  scored.sort((a, b) => {
    if (b.match_score !== a.match_score) {
      return b.match_score - a.match_score;
    }
    return a.current_workload - b.current_workload;
  });

  // Requirement 16.5: return at most 5
  return scored.slice(0, 5);
}
