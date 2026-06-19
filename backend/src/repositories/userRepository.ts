import { query, pool } from '../config/database.js';

export interface UserRow {
    user_id: string;
    email: string;
    password_hash: string;
    role: 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';
    email_verified: boolean;
    prn_no?: string | null;
    roll_no?: string | null;
    batch_year?: number | null;
    expertise_tags?: string[];
    current_workload?: number;
    max_workload?: number;
}

export interface NewUser {
    email: string;
    password_hash: string;
    role: string;
}

type UserRole = 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';

export const userRepository = {
    findByEmail: async (email: string): Promise<UserRow | null> => {
        const rows = await query<UserRow>(
            `SELECT u.user_id, u.email, u.password_hash, u.role, u.email_verified,
                    sp.prn_no, sp.roll_no, sp.batch_year
             FROM users u
             LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
             WHERE u.email = $1`,
            [email]
        );
        return rows[0] ?? null;
    },

    findById: async (userId: string): Promise<UserRow | null> => {
        const rows = await query<UserRow>(
            `SELECT u.user_id, u.email, u.role,
                    sp.prn_no, sp.roll_no, sp.batch_year,
                    fp.expertise_tags, fp.current_workload, fp.max_workload
             FROM users u
             LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
             LEFT JOIN faculty_profiles fp ON fp.faculty_id = u.user_id
             WHERE u.user_id = $1`,
            [userId]
        );
        return rows[0] ?? null;
    },

    findByEmailExists: async (email: string): Promise<boolean> => {
        const rows = await query<{ user_id: string }>(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );
        return rows.length > 0;
    },

    create: async (data: NewUser): Promise<{ user_id: string; email: string; role: UserRole }> => {
        const rows = await query<{ user_id: string; email: string; role: UserRole }>(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role',
            [data.email, data.password_hash, data.role]
        );
        return rows[0];
    },

    setEmailVerified: async (userId: string): Promise<void> => {
        await query('UPDATE users SET email_verified = true WHERE user_id = $1', [userId]);
    },

    updatePassword: async (userId: string, passwordHash: string): Promise<void> => {
        await query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [passwordHash, userId]);
    },

    createStudentProfile: async (userId: string, prnNo: string, rollNo: string, batchYear: number): Promise<void> => {
        await query(
            'INSERT INTO student_profiles (student_id, prn_no, roll_no, batch_year) VALUES ($1, $2, $3, $4)',
            [userId, prnNo, rollNo, batchYear]
        );
    },

    createFacultyProfile: async (userId: string, expertiseTags: string[]): Promise<void> => {
        await query(
            'INSERT INTO faculty_profiles (faculty_id, expertise_tags) VALUES ($1, $2)',
            [userId, expertiseTags]
        );
    },

    storeRefreshToken: async (userId: string, tokenHash: string, expiresAt: Date): Promise<void> => {
        await query(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [userId, tokenHash, expiresAt]
        );
    },

    findRefreshToken: async (tokenHash: string): Promise<{ token_id: string } | null> => {
        const rows = await query<{ token_id: string }>(
            `SELECT token_id FROM refresh_tokens
             WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
            [tokenHash]
        );
        return rows[0] ?? null;
    },

    revokeRefreshToken: async (tokenHash: string): Promise<void> => {
        await query(
            'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
            [tokenHash]
        );
    },

    createEmailVerificationToken: async (userId: string, token: string, expiresAt: Date): Promise<void> => {
        await query(
            'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, token, expiresAt]
        );
    },

    findEmailVerificationToken: async (token: string): Promise<{ token_id: string; user_id: string } | null> => {
        const rows = await query<{ token_id: string; user_id: string }>(
            `SELECT token_id, user_id FROM email_verification_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );
        return rows[0] ?? null;
    },

    markEmailVerificationTokenUsed: async (tokenId: string): Promise<void> => {
        await query('UPDATE email_verification_tokens SET used = true WHERE token_id = $1', [tokenId]);
    },

    createPasswordResetToken: async (userId: string, token: string): Promise<void> => {
        await query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
            [userId, token]
        );
    },

    findPasswordResetToken: async (token: string): Promise<{ token_id: string; user_id: string } | null> => {
        const rows = await query<{ token_id: string; user_id: string }>(
            `SELECT token_id, user_id FROM password_reset_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );
        return rows[0] ?? null;
    },

    markPasswordResetTokenUsed: async (tokenId: string): Promise<void> => {
        await query('UPDATE password_reset_tokens SET used = true WHERE token_id = $1', [tokenId]);
    },

    findStudentWhitelist: async (prnNo: string, email: string): Promise<{ id: string; is_claimed: boolean; full_name: string } | null> => {
        const rows = await query<{ id: string; is_claimed: boolean; full_name: string }>(
            'SELECT id, is_claimed, full_name FROM student_whitelist WHERE prn_no = $1 AND email = $2',
            [prnNo, email]
        );
        return rows[0] ?? null;
    },

    claimStudentWhitelist: async (id: string): Promise<void> => {
        await query('UPDATE student_whitelist SET is_claimed = true WHERE id = $1', [id]);
    },

    findFacultyWhitelist: async (
        email: string,
        role: string,
        employeeId?: string
    ): Promise<{ id: string; is_claimed: boolean; full_name: string; role: string } | null> => {
        let sql = 'SELECT id, is_claimed, full_name, role FROM faculty_whitelist WHERE email = $1 AND role = $2';
        const params: (string | number)[] = [email, role];
        if (employeeId) {
            sql += ' AND employee_id = $3';
            params.push(employeeId);
        }
        const rows = await query<{ id: string; is_claimed: boolean; full_name: string; role: string }>(sql, params);
        return rows[0] ?? null;
    },

    claimFacultyWhitelist: async (id: string): Promise<void> => {
        await query('UPDATE faculty_whitelist SET is_claimed = true WHERE id = $1', [id]);
    },
};
