// Unit tests for auth utility functions (JWT + password hashing).
// No DB, no HTTP — pure function tests.

import { describe, it, expect } from 'vitest';

// Set required env vars before importing jwt utils
process.env.JWT_SECRET = 'test-secret-key-for-vitest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-vitest';

import { generateToken, verifyToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';

// ─── JWT ─────────────────────────────────────────────────────────────────────
describe('generateToken / verifyToken', () => {
  const payload = { user_id: 'u1', email: 'test@test.com', role: 'STUDENT' as const };

  it('generates a non-empty token string', () => {
    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifyToken returns the original payload', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect((decoded as any).user_id).toBe('u1');
    expect((decoded as any).role).toBe('STUDENT');
  });

  it('verifyToken returns null for a tampered token', () => {
    const token = generateToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    const decoded = verifyToken(tampered);
    expect(decoded).toBeNull();
  });
});

describe('generateRefreshToken / verifyRefreshToken', () => {
  const payload = { user_id: 'u2', email: 'r@r.com', role: 'GUIDE' as const };

  it('generates a refresh token string', () => {
    const token = generateRefreshToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifyRefreshToken returns payload for valid token', () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded).toBeDefined();
    expect((decoded as any).user_id).toBe('u2');
  });

  it('verifyRefreshToken returns null for invalid token', () => {
    expect(verifyRefreshToken('not.a.token')).toBeNull();
  });
});

// ─── Password hashing ────────────────────────────────────────────────────────
describe('hashPassword / comparePassword', () => {
  it('hash is a non-empty string different from plaintext', async () => {
    const hash = await hashPassword('secret123');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('secret123');
    expect(hash.length).toBeGreaterThan(10);
  });

  it('comparePassword returns true for correct password', async () => {
    const hash = await hashPassword('mypassword');
    const result = await comparePassword('mypassword', hash);
    expect(result).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const hash = await hashPassword('mypassword');
    const result = await comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });
});
