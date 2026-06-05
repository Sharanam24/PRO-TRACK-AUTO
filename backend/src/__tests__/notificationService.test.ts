// Unit tests for notificationService pure helpers
// DB and Socket.IO are mocked — no real connections needed.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock database ─────────────────────────────────────────────────────────
vi.mock('../config/database.js', () => ({
  query: vi.fn(),
  pool: { query: vi.fn() },
}));

// ─── Mock nodemailer ────────────────────────────────────────────────────────
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test' }),
    })),
  },
}));

import { query } from '../config/database.js';
import {
  createNotification,
  setSocketIo,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/notificationService.js';

const mockQuery = vi.mocked(query);

const fakeNotification = {
  notification_id: 'n1',
  user_id: 'u1',
  title: 'Test',
  message: 'Hello',
  type: 'alert',
  priority: 'medium',
  is_read: false,
  action_url: null,
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createNotification', () => {
  it('inserts notification and returns it', async () => {
    mockQuery
      .mockResolvedValueOnce([fakeNotification])  // INSERT
      .mockResolvedValueOnce([{ cnt: '2' }]);      // COUNT unread

    const result = await createNotification({
      userId: 'u1',
      title: 'Test',
      message: 'Hello',
      type: 'alert',
      priority: 'medium',
    });

    expect(result.notification_id).toBe('n1');
    expect(result.title).toBe('Test');
  });

  it('does not throw when socket is not set', async () => {
    setSocketIo(null as any);
    mockQuery
      .mockResolvedValueOnce([fakeNotification])
      .mockResolvedValueOnce([{ cnt: '0' }]);

    await expect(
      createNotification({ userId: 'u1', title: 'T', message: 'M', type: 'deadline', priority: 'low' })
    ).resolves.not.toThrow();
  });

  it('does not throw when count query fails', async () => {
    mockQuery
      .mockResolvedValueOnce([fakeNotification])
      .mockRejectedValueOnce(new Error('DB down'));

    await expect(
      createNotification({ userId: 'u1', title: 'T', message: 'M', type: 'approval', priority: 'low' })
    ).resolves.toBeDefined();
  });
});

describe('sendVerificationEmail', () => {
  it('silently skips when SMTP_HOST is not set', async () => {
    delete process.env.SMTP_HOST;
    await expect(sendVerificationEmail('a@b.com', 'token123')).resolves.toBeUndefined();
  });
});

describe('sendPasswordResetEmail', () => {
  it('silently skips when SMTP_HOST is not set', async () => {
    delete process.env.SMTP_HOST;
    await expect(sendPasswordResetEmail('a@b.com', 'reset123')).resolves.toBeUndefined();
  });
});
