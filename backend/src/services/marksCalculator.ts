/**
 * Marks Calculator — computes weighted final marks and derives letter grades.
 * Requirements: 4.1, 4.4, 4.5, 4.7, 4.8
 */

export const PHASE_WEIGHTS: Record<string, number> = {
  REVIEW_1: 0.15,
  REVIEW_2: 0.20,
  REVIEW_3: 0.25,
  FINAL: 0.40,
};

/**
 * Computes final marks from a map of phase → marks (null = not yet evaluated).
 *
 * - Uses only completed (non-null) phases.
 * - Normalises weights to the sum of completed phase weights (Requirement 4.5).
 * - Caps each phase contribution at 100 and logs a warning if exceeded (Requirement 4.8).
 * - Returns finalMarks in [0, 100] and the derived grade string (Requirement 4.7).
 */
export function computeFinalMarks(
  phases: Record<string, number | null>,
): { finalMarks: number; grade: string } {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [phase, marks] of Object.entries(phases)) {
    if (marks === null || marks === undefined) continue;

    const weight = PHASE_WEIGHTS[phase];
    if (weight === undefined) continue; // unknown phase — skip

    let capped = marks;
    if (marks > 100) {
      console.warn(
        `[marksCalculator] Phase ${phase} marks (${marks}) exceed 100 — capping at 100`,
      );
      capped = 100;
    }

    weightedSum += capped * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return { finalMarks: 0, grade: deriveGrade(0) };
  }

  const finalMarks = weightedSum / totalWeight;
  return { finalMarks, grade: deriveGrade(finalMarks) };
}

/**
 * Derives a letter grade from a numeric mark in [0, 100].
 * Thresholds (Requirement 4.4):
 *   ≥90 → O, ≥80 → A+, ≥70 → A, ≥60 → B+, ≥50 → B, ≥40 → C, <40 → F
 */
export function deriveGrade(
  marks: number,
): 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F' {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B+';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  return 'F';
}
