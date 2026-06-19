/**
 * Notification Service — DB-backed notifications with optional SMTP email.
 * Requirements: 5.1, 5.2, 5.6, 5.7, 11.1, 11.2, 11.4
 */

import nodemailer from 'nodemailer';
import { query } from '../config/database.js';

// Lazy import to avoid circular dependency (io is created after this module loads)
let _io: import('socket.io').Server | null = null;
export function setSocketIo(io: import('socket.io').Server): void {
    _io = io;
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'deadline' | 'approval' | 'alert' | 'schedule';
  priority: 'high' | 'medium' | 'low';
  action_url?: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

/**
 * Inserts a notification into the DB and sends an email if priority is 'high'
 * and SMTP is configured (Requirement 5.6, 5.7).
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification> {
  const rows = await query(
    `INSERT INTO notifications (user_id, title, message, type, priority, action_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING notification_id, user_id, title, message, type, priority,
               is_read, action_url, created_at`,
    [
      params.userId,
      params.title,
      params.message,
      params.type,
      params.priority,
      params.action_url ?? null,
    ],
  );

  const notification = rows[0] as unknown as Notification;

  // Emit real-time notification badge count (Requirement 11.1, 11.2)
  try {
    const countRows = await query(
      `SELECT COUNT(*) as cnt FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [params.userId],
    );
    const unreadCount = parseInt(String((countRows[0] as { cnt: string }).cnt), 10);
    if (_io) {
      _io.to(`user:${params.userId}`).emit('notification_badge', { unread_count: unreadCount });
    }
  } catch (err) {
    console.error('[notificationService] Badge emit failed:', err);
  }

  // Send email for high-priority notifications when SMTP is configured
  if (params.priority === 'high' && process.env.SMTP_HOST) {
    const userRows = await query(
      'SELECT email FROM users WHERE user_id = $1',
      [params.userId],
    );
    if (userRows.length > 0) {
      const email = (userRows[0] as { email: string }).email;
      await sendEmailIfConfigured(email, params.title, params.message);
    }
  }

  return notification;
}

/**
 * Sends an email via nodemailer if SMTP_HOST is configured.
 * Failures are caught and logged — never thrown (Requirement 5.7).
 */
export async function sendEmailIfConfigured(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  if (!process.env.SMTP_HOST) return;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ?? '',
          }
        : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@protrack.edu',
      to,
      subject,
      text: body,
    });
  } catch (err) {
    console.error('[notificationService] Email send failed:', err);
  }
}

/**
 * Sends a password reset link to the user.
 * Silently skips if SMTP_HOST is not configured (Requirement 6.3).
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  if (!process.env.SMTP_HOST) return;

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const subject = 'Reset your ProTrack password';
  const body = `Hello,\n\nYou requested a password reset for your ProTrack account. Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request a password reset, you can safely ignore this email.`;

  await sendEmailIfConfigured(to, subject, body);
}

/**
 * Sends an email verification link to a newly registered user.
 * Silently skips if SMTP_HOST is not configured (Requirement 5.1).
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  if (!process.env.SMTP_HOST) return;

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  const subject = 'Verify your ProTrack email';
  const body = `Hello,\n\nPlease verify your ProTrack email address by clicking the link below:\n\n${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you did not register for ProTrack, you can safely ignore this email.`;

  await sendEmailIfConfigured(to, subject, body);
}

/**
 * Emits an updated notification_badge event for a user.
 * Called by markAsRead and markAllRead controller actions (Requirement 11.4).
 */
export async function emitBadgeUpdate(userId: string): Promise<void> {
  try {
    const countRows = await query(
      `SELECT COUNT(*) as cnt FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );
    const unreadCount = parseInt(String((countRows[0] as { cnt: string }).cnt), 10);
    if (_io) {
      _io.to(`user:${userId}`).emit('notification_badge', { unread_count: unreadCount });
    }
  } catch (err) {
    console.error('[notificationService] Badge emit failed:', err);
  }
}
