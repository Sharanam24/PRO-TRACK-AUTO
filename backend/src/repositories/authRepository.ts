/**
 * Auth Repository — Data-access layer for all auth-related SQL queries.
 * Controllers call these functions instead of writing raw SQL inline.
 */
import { query } from '../config/database.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserRow {
    user_id: string;
    email: string;
    password_hash: string;
    role: string;
    email_verified: boolean;
    prn_no?: string | null;
    roll_no?: string | null;
    batch_year?: number | null;
}

export interface UserProfileRow {
    user_id: string;
    email: string;
    role: string;
    prn_no?: string | null;
    roll_no?: string | null;
    batch_year?: number | null;
    expertise_tags?: string[];
    current_workload?: number;
    max_workload?: number;
}

export interface NewUserRow {
    user_id: string;
    email: string;
    role: string;
}

export interface WhitelistRow {
    id: string;
    is_claimed: boolean;
    full_name: string;
    role?: string;
}

export interface VerificationTokenRow {
    token_id: string;
    user_id: string;
}

export interface RefreshTokenRow {
    token_id: string;
}

export interface ResetTokenRow {
    token_id: string;
    user_id: string;
}

// ─── User Queries ────────────────────────────────────────────────────────────

/** Find user by email with student profile joined (for login). */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
    const rows = await query(
        `SELECT u.user_id, u.email, u.password_hash, u.role, u.email_verified,
                sp.prn_no, sp.roll_no, sp.batch_year
         FROM users u
         LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
         WHERE u.email = $1`,
        [email]
    );
    return (rows[0] as unknown as UserRow) || null;
}

/** Find user by ID with full profile (student + faculty). */
export async function findUserById(userId: string): Promise<UserProfileRow | null> {
    const rows = await query(
        `SELECT u.user_id, u.email, u.role,
                sp.prn_no, sp.roll_no, sp.batch_year,
                fp.expertise_tags, fp.current_workload, fp.max_workload
         FROM users u
         LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
         LEFT JOIN faculty_profiles fp ON fp.faculty_id = u.user_id
         WHERE u.user_id = $1`,
        [userId]
    );
    return (rows[0] as unknown as UserProfileRow) || null;
}

/** Check if a user exists by email. Returns user_id if found. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
    const rows = await query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
    );
    return rows.length > 0 ? (rows[0] as { user_id: string }).user_id : null;
}

/** Insert a new user and return the created row. */
export async function createUser(
    email: string,
    passwordHash: string,
    role: string
): Promise<NewUserRow> {
    const rows = await query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role',
        [email, passwordHash, role]
    );
    return rows[0] as unknown as NewUserRow;
}

/** Mark a user's email as verified. */
export async function markEmailVerified(userId: string): Promise<void> {
    await query(
        'UPDATE users SET email_verified = true WHERE user_id = $1',
        [userId]
    );
}

/** Update a user's password hash. */
export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await query(
        'UPDATE users SET password_hash = $1 WHERE user_id = $2',
        [passwordHash, userId]
    );
}

// ─── Profile Queries ─────────────────────────────────────────────────────────

/** Create a student profile. */
export async function createStudentProfile(
    studentId: string,
    prnNo: string,
    rollNo: string,
    batchYear: number
): Promise<void> {
    await query(
        'INSERT INTO student_profiles (student_id, prn_no, roll_no, batch_year) VALUES ($1, $2, $3, $4)',
        [studentId, prnNo, rollNo, batchYear]
    );
}

/** Create a faculty profile. */
export async function createFacultyProfile(
    facultyId: string,
    expertiseTags: string[] = []
): Promise<void> {
    await query(
        'INSERT INTO faculty_profiles (faculty_id, expertise_tags) VALUES ($1, $2)',
        [facultyId, expertiseTags]
    );
}

// ─── Whitelist Queries ───────────────────────────────────────────────────────

/** Find a student whitelist entry by PRN and email. */
export async function findStudentWhitelist(
    prnNo: string,
    email: string
): Promise<WhitelistRow | null> {
    const rows = await query(
        'SELECT id, is_claimed, full_name FROM student_whitelist WHERE prn_no = $1 AND email = $2',
        [prnNo, email]
    );
    return (rows[0] as unknown as WhitelistRow) || null;
}

/** Find a faculty whitelist entry by email and role (+ optional employee_id). */
export async function findFacultyWhitelist(
    email: string,
    role: string,
    employeeId?: string
): Promise<WhitelistRow | null> {
    let sql = 'SELECT id, is_claimed, full_name, role FROM faculty_whitelist WHERE email = $1 AND role = $2';
    const params: (string | number)[] = [email, role];

    if (employeeId) {
        sql += ' AND employee_id = $3';
        params.push(employeeId);
    }

    const rows = await query(sql, params);
    return (rows[0] as unknown as WhitelistRow) || null;
}

/** Mark a student whitelist entry as claimed. */
export async function markStudentWhitelistClaimed(id: string): Promise<void> {
    await query('UPDATE student_whitelist SET is_claimed = true WHERE id = $1', [id]);
}

/** Mark a faculty whitelist entry as claimed. */
export async function markFacultyWhitelistClaimed(id: string): Promise<void> {
    await query('UPDATE faculty_whitelist SET is_claimed = true WHERE id = $1', [id]);
}

// ─── Token Queries ───────────────────────────────────────────────────────────

/** Store a hashed refresh token. */
export async function storeRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
): Promise<void> {
    await query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [userId, tokenHash, expiresAt]
    );
}

/** Find a valid (non-revoked, non-expired) refresh token by hash. */
export async function findValidRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const rows = await query(
        `SELECT token_id FROM refresh_tokens
         WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
        [tokenHash]
    );
    return (rows[0] as unknown as RefreshTokenRow) || null;
}

/** Revoke a refresh token by hash. */
export async function revokeRefreshToken(tokenHash: string): Promise<void> {
    await query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
        [tokenHash]
    );
}

/** Store an email verification token. */
export async function storeEmailVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date
): Promise<void> {
    await query(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
    );
}

/** Find a valid email verification token. */
export async function findValidVerificationToken(
    token: string
): Promise<VerificationTokenRow | null> {
    const rows = await query(
        `SELECT token_id, user_id FROM email_verification_tokens
         WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
        [token]
    );
    return (rows[0] as unknown as VerificationTokenRow) || null;
}

/** Mark an email verification token as used. */
export async function markVerificationTokenUsed(tokenId: string): Promise<void> {
    await query(
        'UPDATE email_verification_tokens SET used = true WHERE token_id = $1',
        [tokenId]
    );
}

/** Store a password reset token. */
export async function storePasswordResetToken(userId: string, token: string): Promise<void> {
    await query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [userId, token]
    );
}

/** Find a valid password reset token. */
export async function findValidResetToken(token: string): Promise<ResetTokenRow | null> {
    const rows = await query(
        `SELECT token_id, user_id FROM password_reset_tokens
         WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
        [token]
    );
    return (rows[0] as unknown as ResetTokenRow) || null;
}

/** Mark a password reset token as used. */
export async function markResetTokenUsed(tokenId: string): Promise<void> {
    await query(
        'UPDATE password_reset_tokens SET used = true WHERE token_id = $1',
        [tokenId]
    );
}
