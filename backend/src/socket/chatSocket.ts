/**
 * Chat Socket — Socket.IO real-time chat handlers.
 * Requirements: 7.1–7.8
 */

import type { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { query } from '../config/database.js';
import { createNotification } from '../services/notificationService.js';

interface SendMessagePayload {
    group_id: string;
    content: string;
    is_announcement?: boolean;
}

export function initChatSocket(io: Server): void {
    io.on('connection', async (socket: Socket) => {
        // ── Auth ────────────────────────────────────────────────────────────
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) {
            socket.emit('connection_error', { message: 'Unauthorized' });
            socket.disconnect(true);
            return;
        }

        const user = verifyToken(token);
        if (!user) {
            socket.emit('connection_error', { message: 'Unauthorized' });
            socket.disconnect(true);
            return;
        }

        console.log(`[chatSocket] User ${user.email} connected (${socket.id})`);

        // Join user's personal room for badge notifications (Requirement 11.3)
        await socket.join(`user:${user.user_id}`);

        // ── join_room ────────────────────────────────────────────────────────
        socket.on('join_room', async (groupId: string) => {
            // Verify user is a member or guide of the group (Requirement 7.3)
            const memberRows = await query(
                `SELECT 1 FROM group_members WHERE group_id = $1 AND student_id = $2`,
                [groupId, user.user_id]
            ).catch(() => []);

            const guideRows = memberRows.length === 0
                ? await query(
                    `SELECT 1 FROM project_groups WHERE group_id = $1 AND guide_id = $2`,
                    [groupId, user.user_id]
                ).catch(() => [])
                : [];

            const isMember = memberRows.length > 0 || guideRows.length > 0;
            if (!isMember) {
                socket.emit('connection_error', { message: 'Unauthorized' });
                socket.disconnect(true);
                return;
            }

            const room = `group:${groupId}`;
            await socket.join(room);

            // Send last 50 messages as history (Requirement 7.5)
            try {
                const messages = await query(
                    `SELECT m.message_id, m.sender_id, u.email as sender_email,
                            m.content, m.is_announcement, m.created_at
                     FROM chat_messages m
                     JOIN users u ON m.sender_id = u.user_id
                     WHERE m.group_id = $1
                     ORDER BY m.created_at ASC
                     LIMIT 50`,
                    [groupId]
                );
                socket.emit('history', messages);
            } catch (err) {
                console.error('[chatSocket] History fetch error:', err);
            }
        });

        // ── send_message ─────────────────────────────────────────────────────
        socket.on('send_message', async (payload: SendMessagePayload) => {
            const { group_id, content, is_announcement = false } = payload;
            if (!group_id || !content) return;

            try {
                // Persist to DB (Requirement 7.4)
                const rows = await query(
                    `INSERT INTO chat_messages (group_id, sender_id, content, is_announcement)
                     VALUES ($1, $2, $3, $4)
                     RETURNING message_id, group_id, sender_id, content, is_announcement, created_at`,
                    [group_id, user.user_id, content, is_announcement]
                );
                const message = rows[0];

                // Broadcast to room (Requirement 7.4)
                io.to(`group:${group_id}`).emit('new_message', {
                    ...message,
                    sender_email: user.email,
                });

                // Announcements trigger notifications for each group member (Requirement 7.7)
                if (is_announcement) {
                    const members = await query(
                        `SELECT student_id FROM group_members WHERE group_id = $1`,
                        [group_id]
                    );
                    await Promise.all(
                        members.map((m) =>
                            createNotification({
                                userId: m.student_id as string,
                                title: 'Announcement from your guide',
                                message: content,
                                type: 'alert',
                                priority: 'high',
                            })
                        )
                    ).catch((err) =>
                        console.error('[chatSocket] Announcement notification error:', err)
                    );
                }
            } catch (err) {
                console.error('[chatSocket] send_message error:', err);
            }
        });

        // ── typing ───────────────────────────────────────────────────────────
        socket.on('typing', (groupId: string) => {
            socket.to(`group:${groupId}`).emit('user_typing', {
                user_id: user.user_id,
                email: user.email,
            });
        });

        // ── disconnect ───────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`[chatSocket] User ${user.email} disconnected`);
        });
    });
}
