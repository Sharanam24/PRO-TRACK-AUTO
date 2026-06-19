/**
 * At-Risk Classifier — identifies project groups that need coordinator attention.
 * Requirements: 6.2, 6.5, 17.1–17.4
 */

export interface AtRiskResult {
  isAtRisk: boolean;
  /** Severity level derived from the number of active conditions.
   *  CRITICAL = 2 or more conditions true (Req 17.2)
   *  AT_RISK  = exactly 1 condition true  (Req 17.3)
   *  ON_TRACK = zero conditions true      (Req 17.4)
   */
  risk_level: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  reasons: {
    lowLogbooks: boolean;
    lowTaskCompletion: boolean;
    missingEvaluation: boolean;
  };
  /** Actionable steps for the coordinator/guide. Non-empty for AT_RISK and CRITICAL. */
  recommendations: string[];
  lastLogbookDate: string | null;
  taskCompletionPct: number;
}

export interface DbClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/**
 * Classifies whether a group is at risk based on three conditions:
 * 1. Fewer than 2 approved logbook entries in the last 21 days
 * 2. Task completion rate (DONE/total) < 40%
 * 3. Any past phase has no evaluation record
 *
 * @param groupId - UUID of the project group
 * @param db - DB client with a query method
 */
export async function classifyAtRisk(
  groupId: string,
  db: DbClient,
): Promise<AtRiskResult> {
  // Condition 1: Logbook check — < 2 approved entries in last 21 days
  const logbookResult = await db.query(
    `SELECT COUNT(*) as count, MAX(created_at) as last_date
     FROM logbooks
     WHERE group_id = $1
       AND guide_status = 'APPROVED'
       AND created_at >= NOW() - INTERVAL '21 days'`,
    [groupId],
  );
  const logbookRow = logbookResult.rows[0] as {
    count: string;
    last_date: string | null;
  };
  const approvedLogbooks = parseInt(logbookRow.count, 10);
  const lastLogbookDate = logbookRow.last_date ?? null;
  const lowLogbooks = approvedLogbooks < 2;

  // Condition 2: Task completion < 40%
  const taskResult = await db.query(
    `SELECT COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'DONE') as done
     FROM group_tasks
     WHERE group_id = $1`,
    [groupId],
  );
  const taskRow = taskResult.rows[0] as { total: string; done: string };
  const totalTasks = parseInt(taskRow.total, 10);
  const doneTasks = parseInt(taskRow.done, 10);
  const taskCompletionPct = totalTasks === 0 ? 0 : (doneTasks / totalTasks) * 100;
  const lowTaskCompletion = taskCompletionPct < 40;

  // Condition 3: Any past phase missing evaluation
  const phaseResult = await db.query(
    `SELECT phase, presentation_time
     FROM presentation_schedules
     WHERE group_id = $1
       AND presentation_time < NOW()`,
    [groupId],
  );
  const pastPhases = phaseResult.rows as { phase: string; presentation_time: string }[];

  let missingEvaluation = false;
  if (pastPhases.length > 0) {
    const evalResult = await db.query(
      `SELECT DISTINCT phase FROM evaluations WHERE group_id = $1`,
      [groupId],
    );
    const evaluatedPhases = new Set(
      (evalResult.rows as { phase: string }[]).map((r) => r.phase),
    );
    missingEvaluation = pastPhases.some((p) => !evaluatedPhases.has(p.phase));
  }

  // Count the number of active risk conditions
  const activeConditions = [lowLogbooks, lowTaskCompletion, missingEvaluation].filter(Boolean).length;

  // Derive severity level (Req 17.2–17.4)
  let risk_level: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  if (activeConditions >= 2) {
    risk_level = 'CRITICAL';
  } else if (activeConditions === 1) {
    risk_level = 'AT_RISK';
  } else {
    risk_level = 'ON_TRACK';
  }

  // isAtRisk is true whenever risk_level is not ON_TRACK (Req 17.8)
  const isAtRisk = risk_level !== 'ON_TRACK';

  // Build human-readable recommendations
  const recommendations: string[] = [];
  if (lowLogbooks) {
    recommendations.push('Submit overdue logbook entries — at least 2 approved entries are required every 21 days.');
  }
  if (lowTaskCompletion) {
    recommendations.push('Complete pending tasks — task completion is below 40%. Review and close outstanding work items.');
  }
  if (missingEvaluation) {
    recommendations.push('Schedule missing evaluation — one or more past presentation phases have no evaluation record. Contact the coordinator.');
  }
  if (risk_level === 'CRITICAL') {
    recommendations.push('Immediate action required: contact your guide and coordinator to create a recovery plan.');
  }

  return {
    isAtRisk,
    risk_level,
    reasons: { lowLogbooks, lowTaskCompletion, missingEvaluation },
    recommendations,
    lastLogbookDate,
    taskCompletionPct,
  };
}
