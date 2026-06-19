import { Request, Response } from 'express';
import crypto from 'crypto';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/notificationService.js';
import { userRepository } from '../repositories/userRepository.js';

interface LoginRequest {
    email: string;
    password: string;
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body as LoginRequest;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await userRepository.findByEmail(email);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const passwordMatch = await comparePassword(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        if (process.env.EMAIL_VERIFICATION_DISABLED !== 'true' && !user.email_verified) {
            res.status(403).json({
                error: 'Please verify your email address before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
            });
            return;
        }

        const token = generateToken({ user_id: user.user_id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ user_id: user.user_id, email: user.email, role: user.role });
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await userRepository.storeRefreshToken(user.user_id, refreshTokenHash, refreshExpiresAt);

        res.status(200).json({
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            prn_no: user.prn_no ?? null,
            roll_no: user.roll_no ?? null,
            batch_year: user.batch_year ?? null,
            token,
            refresh_token: refreshToken,
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

        const user = await userRepository.findById(userId);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }

        res.status(200).json({
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            prn_no: user.prn_no ?? null,
            roll_no: user.roll_no ?? null,
            batch_year: user.batch_year ?? null,
            expertise_tags: user.expertise_tags ?? [],
            current_workload: user.current_workload ?? 0,
            max_workload: user.max_workload ?? 4,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, role, prn_no, roll_no, batch_year, expertise_tags } = req.body;

        if (!email || !password || !role) {
            res.status(400).json({ error: 'Email, password, and role are required' });
            return;
        }

        const validRoles = ['STUDENT', 'GUIDE', 'COORDINATOR', 'COMMITTEE'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
            return;
        }

        const exists = await userRepository.findByEmailExists(email);
        if (exists) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        const passwordHash = await hashPassword(password);
        const newUser = await userRepository.create({ email, password_hash: passwordHash, role });

        if (role === 'STUDENT') {
            if (!prn_no || !roll_no || !batch_year) {
                res.status(400).json({ error: 'For STUDENT role, prn_no, roll_no, and batch_year are required' });
                return;
            }
            await userRepository.createStudentProfile(newUser.user_id, prn_no, roll_no, batch_year);
        } else if (role === 'GUIDE') {
            const tags = (expertise_tags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
            await userRepository.createFacultyProfile(newUser.user_id, tags);
        }

        const token = generateToken({ user_id: newUser.user_id, email: newUser.email, role: newUser.role });

        if (process.env.EMAIL_VERIFICATION_DISABLED === 'true') {
            await userRepository.setEmailVerified(newUser.user_id);
        } else {
            try {
                const verificationToken = crypto.randomUUID();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await userRepository.createEmailVerificationToken(newUser.user_id, verificationToken, expiresAt);
                await sendVerificationEmail(newUser.email, verificationToken);
            } catch (emailError) {
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
            token,
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

        const exists = await userRepository.findByEmailExists(email);
        if (exists) {
            res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
            return;
        }

        if (role === 'STUDENT') {
            if (!prn_no) {
                res.status(400).json({ error: 'PRN number is required for students' });
                return;
            }
            const whitelisted = await userRepository.findStudentWhitelist(prn_no, email);
            if (!whitelisted) {
                res.status(404).json({ error: 'No matching record found. Please verify your PRN and email.' });
                return;
            }
            if (whitelisted.is_claimed) {
                res.status(400).json({ error: 'This account has already been claimed. Please log in.' });
                return;
            }

            const passwordHash = await hashPassword(password);
            const newUser = await userRepository.create({ email, password_hash: passwordHash, role: 'STUDENT' });
            const currentYear = new Date().getFullYear();
            await userRepository.createStudentProfile(newUser.user_id, prn_no, prn_no, currentYear);
            await userRepository.claimStudentWhitelist(whitelisted.id);

            const token = generateToken({ user_id: newUser.user_id, email: newUser.email, role: newUser.role });
            res.status(201).json({ user_id: newUser.user_id, email: newUser.email, role: newUser.role, prn_no, token });

        } else if (['GUIDE', 'COMMITTEE', 'COORDINATOR'].includes(role)) {
            const whitelisted = await userRepository.findFacultyWhitelist(email, role, employee_id);
            if (!whitelisted) {
                res.status(404).json({ error: 'No matching record found. Please verify your email.' });
                return;
            }
            if (whitelisted.is_claimed) {
                res.status(400).json({ error: 'This account has already been claimed. Please log in.' });
                return;
            }

            const passwordHash = await hashPassword(password);
            const newUser = await userRepository.create({ email, password_hash: passwordHash, role });

            if (role === 'GUIDE') {
                await userRepository.createFacultyProfile(newUser.user_id, []);
            }

            await userRepository.claimFacultyWhitelist(whitelisted.id);
            const token = generateToken({ user_id: newUser.user_id, email: newUser.email, role: newUser.role });
            res.status(201).json({ user_id: newUser.user_id, email: newUser.email, role: newUser.role, token });

        } else {
            res.status(400).json({ error: 'Invalid role.' });
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

        const payload = verifyRefreshToken(refresh_token);
        if (!payload) {
            res.status(401).json({ error: 'Invalid or expired refresh token', code: 'UNAUTHORIZED' });
            return;
        }

        const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
        const storedToken = await userRepository.findRefreshToken(tokenHash);
        if (!storedToken) {
            res.status(401).json({ error: 'Invalid or expired refresh token', code: 'UNAUTHORIZED' });
            return;
        }

        await userRepository.revokeRefreshToken(tokenHash);

        const newAccessToken = generateToken({ user_id: payload.user_id, email: payload.email, role: payload.role });
        const newRefreshToken = generateRefreshToken({ user_id: payload.user_id, email: payload.email, role: payload.role });
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await userRepository.storeRefreshToken(payload.user_id, newRefreshTokenHash, newExpiresAt);

        res.status(200).json({ access_token: newAccessToken, refresh_token: newRefreshToken });
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

        const record = await userRepository.findEmailVerificationToken(token);
        if (!record) {
            res.status(400).json({ error: 'Invalid or expired verification token' });
            return;
        }

        await userRepository.setEmailVerified(record.user_id);
        await userRepository.markEmailVerificationTokenUsed(record.token_id);

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

        const user = await userRepository.findByEmail(email);
        if (!user) {
            res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
            return;
        }

        const resetToken = crypto.randomUUID();
        await userRepository.createPasswordResetToken(user.user_id, resetToken);

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
            await userRepository.revokeRefreshToken(tokenHash);
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

        const record = await userRepository.findPasswordResetToken(token);
        if (!record) {
            res.status(400).json({ error: 'Invalid or expired reset token', code: 'INVALID_TOKEN' });
            return;
        }

        const passwordHash = await hashPassword(new_password);
        await userRepository.updatePassword(record.user_id, passwordHash);
        await userRepository.markPasswordResetTokenUsed(record.token_id);

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
}
