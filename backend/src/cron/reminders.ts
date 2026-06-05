import cron from 'node-cron';
import { pool } from '../config/database.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Checks all active project groups to see if they have submitted a logbook in the last 7 days.
 * If not, it inserts an urgent system alert into their chat.
 */
export const checkOverdueReminders = async () => {
    console.log('[Cron] Starting overdue reminders check...');
    try {
        // 1. Get all active groups
        const activeGroupsResult = await pool.query(
            "SELECT group_id FROM project_groups WHERE status = 'ACTIVE'"
        );
        const activeGroups = activeGroupsResult.rows;

        if (activeGroups.length === 0) {
            console.log('[Cron] No active groups found. Skipping.');
            return { processed: 0, alerted: 0 };
        }

        // 2. Get the system/coordinator user id to send the message as, or just use a NULL/special ID.
        // For simplicity, we will query for a user with the role 'COORDINATOR' to act as the sender.
        const coordinatorResult = await pool.query(
            "SELECT user_id FROM users WHERE role = 'COORDINATOR' LIMIT 1"
        );
        
        if (coordinatorResult.rows.length === 0) {
            console.error('[Cron] No coordinator found to send alerts from.');
            return { processed: 0, alerted: 0 };
        }
        
        const senderId = coordinatorResult.rows[0].user_id;
        let alertedCount = 0;

        // 3. For each group, check if they have a logbook submitted in the last 7 days.
        for (const group of activeGroups) {
            const { group_id } = group;
            
            const recentLogbookResult = await pool.query(
                `SELECT log_id FROM logbooks 
                 WHERE group_id = $1 AND created_at >= NOW() - INTERVAL '7 days' 
                 LIMIT 1`,
                [group_id]
            );

            // If no recent logbook, send the alert
            if (recentLogbookResult.rows.length === 0) {
                await pool.query(
                    `INSERT INTO chat_messages (group_id, sender_id, content, is_announcement) 
                     VALUES ($1, $2, $3, $4)`,
                    [
                        group_id, 
                        senderId, 
                        "⚠️ System Alert: Your group has an overdue weekly logbook. Please submit it immediately to avoid penalties.", 
                        true // treating as announcement so it highlights
                    ]
                );
                alertedCount++;
            }
        }

        console.log(`[Cron] Reminders check complete. Processed ${activeGroups.length} groups, alerted ${alertedCount}.`);
        return { processed: activeGroups.length, alerted: alertedCount };
    } catch (error) {
        console.error('[Cron] Error checking overdue reminders:', error);
        throw error;
    }
};

/**
 * Checks pending milestones due in 7, 3, or 1 day and sends notifications.
 * Deduplicates by checking for existing same-day notifications (Requirement 10.5).
 * Requirements: 10.1–10.5
 */
export const checkMilestoneReminders = async () => {
    console.log('[Cron] Starting milestone reminder check...');
    try {
        for (const daysAhead of [7, 3, 1]) {
            const priority: 'medium' | 'high' = daysAhead === 7 ? 'medium' : 'high';

            // Get PENDING milestones due exactly N days from today
            const milestonesResult = await pool.query(
                `SELECT mp.milestone_id, mp.group_id, mp.title, mp.due_date,
                        pg.guide_id
                 FROM milestone_progress mp
                 JOIN project_groups pg ON mp.group_id = pg.group_id
                 WHERE mp.status = 'PENDING'
                   AND DATE_TRUNC('day', mp.due_date) = CURRENT_DATE + ($1 * INTERVAL '1 day')`,
                [daysAhead]
            );

            for (const milestone of milestonesResult.rows) {
                const { group_id, milestone_id, title, guide_id } = milestone as {
                    group_id: string;
                    milestone_id: string;
                    title: string;
                    guide_id: string | null;
                };

                // Get all group members
                const membersResult = await pool.query(
                    `SELECT student_id FROM group_members WHERE group_id = $1`,
                    [group_id]
                );

                const notifTitle = `Milestone due in ${daysAhead} day${daysAhead > 1 ? 's' : ''}: ${title}`;

                for (const member of membersResult.rows) {
                    const userId = (member as { student_id: string }).student_id;

                    // Deduplicate: skip if same-day notification already exists
                    const dupCheck = await pool.query(
                        `SELECT 1 FROM notifications
                         WHERE user_id = $1
                           AND type = 'schedule'
                           AND title = $2
                           AND DATE_TRUNC('day', created_at) = CURRENT_DATE
                         LIMIT 1`,
                        [userId, notifTitle]
                    );
                    if (dupCheck.rows.length > 0) continue;

                    await createNotification({
                        userId,
                        title: notifTitle,
                        message: `Your group has a milestone "${title}" due in ${daysAhead} day${daysAhead > 1 ? 's' : ''}. Make sure it is completed on time.`,
                        type: 'schedule',
                        priority,
                    });
                }

                // 1-day: also notify the assigned guide (Requirement 10.4)
                if (daysAhead === 1 && guide_id) {
                    const dupCheck = await pool.query(
                        `SELECT 1 FROM notifications
                         WHERE user_id = $1
                           AND type = 'schedule'
                           AND title = $2
                           AND DATE_TRUNC('day', created_at) = CURRENT_DATE
                         LIMIT 1`,
                        [guide_id, notifTitle]
                    );
                    if (dupCheck.rows.length === 0) {
                        await createNotification({
                            userId: guide_id,
                            title: notifTitle,
                            message: `One of your groups has a milestone "${title}" due tomorrow.`,
                            type: 'schedule',
                            priority: 'high',
                        });
                    }
                }
            }
        }
        console.log('[Cron] Milestone reminder check complete.');
    } catch (error) {
        console.error('[Cron] Error checking milestone reminders:', error);
    }
};

/**
 * Nightly risk scan: reclassifies every active group and updates risk_level in DB.
 * Sends high-priority notification to coordinator for newly CRITICAL groups.
 * Requirements: 17.6, 17.7
 */
export const runNightlyRiskScan = async () => {
    console.log('[Cron] Starting nightly risk scan...');
    try {
        const { classifyAtRisk } = await import('../services/atRiskClassifier.js');

        const db = {
            async query(text: string, params?: unknown[]) {
                const result = await pool.query(text, params);
                return { rows: result.rows as Record<string, unknown>[] };
            },
        };

        // Get coordinator for notifications
        const coordResult = await pool.query(
            `SELECT user_id FROM users WHERE role = 'COORDINATOR' LIMIT 1`
        );
        const coordinatorId: string | null = coordResult.rows.length > 0
            ? (coordResult.rows[0] as { user_id: string }).user_id
            : null;

        // Get all ACTIVE groups with their current risk_level
        const groups = await pool.query(
            `SELECT group_id, risk_level FROM project_groups WHERE status = 'ACTIVE'`
        );

        for (const row of groups.rows) {
            const { group_id, risk_level: previousLevel } = row as {
                group_id: string;
                risk_level: string;
            };

            const result = await classifyAtRisk(group_id, db);
            const newLevel = result.risk_level;

            // Update risk_level in DB
            await pool.query(
                `UPDATE project_groups SET risk_level = $1 WHERE group_id = $2`,
                [newLevel, group_id]
            );

            // Notify coordinator if group became CRITICAL (Requirement 17.7)
            if (newLevel === 'CRITICAL' && previousLevel !== 'CRITICAL' && coordinatorId) {
                const groupInfo = await pool.query(
                    `SELECT group_name FROM project_groups WHERE group_id = $1`,
                    [group_id]
                );
                const groupName = (groupInfo.rows[0] as { group_name: string })?.group_name ?? group_id;

                await createNotification({
                    userId: coordinatorId,
                    title: `Group "${groupName}" is now CRITICAL`,
                    message: `The group "${groupName}" has been classified as CRITICAL risk. Immediate attention is recommended.`,
                    type: 'alert',
                    priority: 'high',
                });
            }
        }

        console.log(`[Cron] Nightly risk scan complete. Processed ${groups.rows.length} groups.`);
    } catch (error) {
        console.error('[Cron] Error during nightly risk scan:', error);
    }
};

// Initialize the cron job
export const initCronJobs = () => {
    // Run every Friday at 17:00 (5:00 PM)
    // format: min hour day-of-month month day-of-week
    cron.schedule('0 17 * * 5', async () => {
        console.log('[Cron] Triggering scheduled Friday 5PM overdue reminder check...');
        await checkOverdueReminders();
    });

    // Daily 08:00 — milestone deadline reminders (Requirement 10.1)
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Triggering daily milestone reminder check...');
        await checkMilestoneReminders();
    });

    // Daily 00:00 UTC — nightly at-risk scan (Requirement 17.6)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Triggering nightly risk scan...');
        await runNightlyRiskScan();
    });

    console.log('[Cron] Scheduled jobs initialized (Overdue reminders: Friday 17:00 | Milestone reminders: daily 08:00 | Risk scan: daily 00:00).');
};
