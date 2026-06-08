import { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../config/database.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/notificationService.js';

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    user_id: string;
    email: string;
    role: string;
    token: string;
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body as LoginRequest;

        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Find user by email — also join student_profiles to get PRN
        const users = await query(
            `SELECT u.user_id, u.email, u.password_hash, u.role, u.email_verified,
                    sp.prn_no, sp.roll_no, sp.batch_year
             FROM users u
             LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
             WHERE u.email = $1`,
            [email]
        );

        if (users.length === 0) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const user = users[0];

        // Verify password
        const passwordMatch = await comparePassword(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Block login if email not verified (skip check when EMAIL_VERIFICATION_DISABLED=true)
        if (process.env.EMAIL_VERIFICATION_DISABLED !== 'true' && !user.email_verified) {
            res.status(403).json({
                error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                code: 'EMAIL_NOT_VERIFIED',
            });
            return;
        }

        // Generate JWT token
        const token = generateToken({
            user_id: user.user_id,
            email: user.email,
            role: user.role
        });

        // Generate refresh token, hash it, and store in DB
        const refreshToken = generateRefreshToken({
            user_id: user.user_id,
            email: user.email,
            role: user.role
        });
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        await query(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [user.user_id, refreshTokenHash, refreshExpiresAt]
        );

        res.status(200).json({
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            prn_no: user.prn_no || null,
            roll_no: user.roll_no || null,
            batch_year: user.batch_year || null,
            token,
            refresh_token: refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

export async function getMe(req: Request & { user?: { user_id: string; role: string } }, res: Response): Promise<void> {
    try {
        const userId = req.user?.user_id;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const users = await query(
            `SELECT u.user_id, u.email, u.role,
                    sp.prn_no, sp.roll_no, sp.batch_year,
                    fp.expertise_tags, fp.current_workload, fp.max_workload
             FROM users u
             LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
             LEFT JOIN faculty_profiles fp ON fp.faculty_id = u.user_id
             WHERE u.user_id = $1`,
            [userId]
        );

        if (users.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
        const u = users[0];

        res.status(200).json({
            user_id: u.user_id,
            email: u.email,
            role: u.role,
            prn_no: u.prn_no || null,
            roll_no: u.roll_no || null,
            batch_year: u.batch_year || null,
            expertise_tags: u.expertise_tags || [],
            current_workload: u.current_workload || 0,
            max_workload: u.max_workload || 4,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, role, prn_no, roll_no, batch_year, expertise_tags } = req.body;

        // Validate input
        if (!email || !password || !role) {
            res.status(400).json({ error: 'Email, password, and role are required' });
            return;
        }

        // Validate role
        const validRoles = ['STUDENT', 'GUIDE', 'COORDINATOR', 'COMMITTEE'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
            return;
        }

        // Check if user already exists
        const existingUsers = await query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );

        if (existingUsers.length > 0) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert user
        const userResult = await query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role',
            [email, passwordHash, role]
        );

        const newUser = userResult[0];

        // Insert role-specific profiles
        if (role === 'STUDENT') {
            if (!prn_no || !roll_no || !batch_year) {
                res.status(400).json({
                    error: 'For STUDENT role, prn_no, roll_no, and batch_year are required'
                });
                return;
            }

            await query(
                'INSERT INTO student_profiles (student_id, prn_no, roll_no, batch_year) VALUES ($1, $2, $3, $4)',
                [newUser.user_id, prn_no, roll_no, batch_year]
            );
        } else if (role === 'GUIDE') {
            const tags = (expertise_tags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
            await query(
                'INSERT INTO faculty_profiles (faculty_id, expertise_tags) VALUES ($1, $2)',
                [newUser.user_id, tags]
            );
        }

        // Generate token
        const token = generateToken({
            user_id: newUser.user_id,
            email: newUser.email,
            role: newUser.role
        });

        // Handle email verification
        if (process.env.EMAIL_VERIFICATION_DISABLED === 'true') {
            // Skip token generation; mark user as verified immediately (Requirement 5.5)
            await query(
                'UPDATE users SET email_verified = true WHERE user_id = $1',
                [newUser.user_id]
            );
        } else {
            // Generate a verification token and send the verification email (Requirement 5.1)
            try {
                const verificationToken = crypto.randomUUID();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
                await query(
                    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                    [newUser.user_id, verificationToken, expiresAt]
                );
                await sendVerificationEmail(newUser.email, verificationToken);
            } catch (emailError) {
                // Do NOT block registration on email sending failure (Requirement 5.1)
                console.error('Email verification setup failed:', emailError);
            }
        }

        res.status(201).json({
            user_id: newUser.user_id,
            email: newUser.email,
            role: newUser.role,
            prn_no: prn_no || null,
            roll_no: roll_no || null,
            batch_year: batch_year || null,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}

export async function claimAccount(req: Request, res: Response): Promise<void> {
    try {
        const { role, email, password, prn_no, employee_id } = req.body;

        if (!role || !email || !password) {
            res.status(400).json({ error: 'Role, email, and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        // Check if user already exists in users table
        const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (existing.length > 0) {
            res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
            return;
        }

        if (role === 'STUDENT') {
            // Student claim: verify PRN + email against student_whitelist
            if (!prn_no) {
                res.status(400).json({ error: 'PRN number is required for students' });
                return;
            }
            const whitelisted = await query(
                'SELECT id, is_claimed, full_name FROM student_whitelist WHERE prn_no = $1 AND email = $2',
                [prn_no, email]
            );
            if (whitelisted.length === 0) {
                res.status(404).json({ error: 'No matching record found. Please verify your PRN and email with your coordinator.' });
                return;
            }
            if (whitelisted[0].is_claimed) {
                res.status(400).json({ error: 'This account has already been claimed. Please log in.' });
                return;
            }

            const passwordHash = await hashPassword(password);
            const userResult = await query(
                "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'STUDENT') RETURNING user_id, email, role",
                [email, passwordHash]
            );
            const newUser = userResult[0];
            const currentYear = new Date().getFullYear();
            await query(
                'INSERT INTO student_profiles (student_id, prn_no, roll_no, batch_year) VALUES ($1, $2, $3, $4)',
                [newUser.user_id, prn_no, prn_no, currentYear]
            );
            await query('UPDATE student_whitelist SET is_claimed = true WHERE id = $1', [whitelisted[0].id]);

            const token = generateToken({ user_id: newUser.user_id, email: newUser.email, role: newUser.role });
            res.status(201).json({ user_id: newUser.user_id, email: newUser.email, role: newUser.role, prn_no, token });

        } else if (role === 'GUIDE' || role === 'COMMITTEE' || role === 'COORDINATOR') {
            // Faculty/Committee claim: verify email (+ optional employee_id) against faculty_whitelist
            let whereClause = 'WHERE email = $1 AND role = $2';
            let params: (string | number)[] = [email, role];

            if (employee_id) {
                whereClause += ' AND employee_id = $3';
                params.push(employee_id);
            }

            const whitelisted = await query(
                `SELECT id, is_claimed, full_name, role FROM faculty_whitelist ${whereClause}`,
                params
            );
            if (whitelisted.length === 0) {
                res.status(404).json({ error: 'No matching record found. Please verify your email with your administrator.' });
                return;
            }
            if (whitelisted[0].is_claimed) {
                res.status(400).json({ error: 'This account has already been claimed. Please log in.' });
                return;
            }

            const passwordHash = await hashPassword(password);
            const userResult = await query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role',
                [email, passwordHash, role]
            );
            const newUser = userResult[0];

            // Create faculty profile for GUIDE role
            if (role === 'GUIDE') {
                await query(
                    'INSERT INTO faculty_profiles (faculty_id) VALUES ($1)',
                    [newUser.user_id]
                );
            }

            await query('UPDATE faculty_whitelist SET is_claimed = true WHERE id = $1', [whitelisted[0].id]);

            const token = generateToken({ user_id: newUser.user_id, email: newUser.email, role: newUser.role });
            res.status(201).json({ user_id: newUser.user_id, email: newUser.email, role: newUser.role, token });

        } else {
            res.status(400).json({ error: 'Invalid role. Claim is available for STUDENT, GUIDE, COMMITTEE, and COORDINATOR.' });
        }
    } catch (error) {
        console.error('Claim account error:', error);
        res.status(500).json({ error: 'Failed to claim account' });
    }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        // Verify token cryptographically
        const payload = verifyRefreshToken(refresh_token);
        if (!payload) {
            res.status(401).json({ error: 'Invalid or expired refresh token', code: 'UNAUTHORIZED' });
            return;
        }

        // Hash the incoming token and look up in DB
        const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
        const rows = await query(
            `SELECT token_id FROM refresh_tokens
             WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
            [tokenHash]
        );

        if (rows.length === 0) {
            res.status(401).json({ error: 'Invalid or expired refresh token', code: 'UNAUTHORIZED' });
            return;
        }

        // Revoke old token
        await query(
            'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
            [tokenHash]
        );

        // Generate new access token and refresh token
        const newAccessToken = generateToken({
            user_id: payload.user_id,
            email: payload.email,
            role: payload.role
        });
        const newRefreshToken = generateRefreshToken({
            user_id: payload.user_id,
            email: payload.email,
            role: payload.role
        });

        // Store new refresh token (hashed)
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await query(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [payload.user_id, newRefreshTokenHash, newExpiresAt]
        );

        res.status(200).json({
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
    try {
        const token = req.query.token as string | undefined;

        if (!token) {
            res.status(400).json({ error: 'Verification token is required' });
            return;
        }

        // Look up a valid, unused, non-expired token (Requirement 5.2, 5.3)
        const rows = await query(
            `SELECT token_id, user_id FROM email_verification_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );

        if (rows.length === 0) {
            res.status(400).json({ error: 'Invalid or expired verification token' });
            return;
        }

        const { token_id, user_id } = rows[0] as { token_id: string; user_id: string };

        // Mark user's email as verified (Requirement 5.2)
        await query(
            'UPDATE users SET email_verified = true WHERE user_id = $1',
            [user_id]
        );

        // Mark token as used
        await query(
            'UPDATE email_verification_tokens SET used = true WHERE token_id = $1',
            [token_id]
        );

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Email verification failed' });
    }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        // Look up user by email (Requirement 6.1)
        const users = await query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );

        // Anti-enumeration: always return the same response whether or not email exists (Requirement 6.2)
        if (users.length === 0) {
            res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
            return;
        }

        const { user_id } = users[0] as { user_id: string };

        // Generate reset token and store it (Requirement 6.1)
        const resetToken = crypto.randomUUID();
        await query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
            [user_id, resetToken]
        );

        // Send password reset email — never block response on failure (Requirement 6.3)
        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
            console.error('Password reset email send failed:', emailError);
        }

        res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process forgot password request' });
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
    try {
        const { refresh_token } = req.body;
        if (refresh_token) {
            const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
            await query(
                'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
                [tokenHash]
            );
        }
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            res.status(400).json({ error: 'Token and new_password are required' });
            return;
        }

        // Look up valid, unused, non-expired reset token (Requirement 6.4)
        const rows = await query(
            `SELECT token_id, user_id FROM password_reset_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );

        if (rows.length === 0) {
            res.status(400).json({ error: 'Invalid or expired reset token', code: 'INVALID_TOKEN' });
            return;
        }

        const { token_id, user_id } = rows[0] as { token_id: string; user_id: string };

        // Hash the new password (Requirement 6.5)
        const passwordHash = await hashPassword(new_password);

        // Update the user's password
        await query(
            'UPDATE users SET password_hash = $1 WHERE user_id = $2',
            [passwordHash, user_id]
        );

        // Mark the reset token as used (Requirement 6.6)
        await query(
            'UPDATE password_reset_tokens SET used = true WHERE token_id = $1',
            [token_id]
        );

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
}
