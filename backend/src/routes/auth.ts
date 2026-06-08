import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.js';
import { authenticateToken } from '../utils/jwt.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Rate limiter for login — 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts. Please try again in 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
});

// Rate limiter for forgot-password / claim — 5 per 15 minutes per IP
const sensitiveAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests. Please try again in 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
});

// Public routes
router.post('/login', loginLimiter, authController.login);
router.post('/claim-account', sensitiveAuthLimiter, authController.claimAccount);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', sensitiveAuthLimiter, authController.forgotPassword);
router.post('/reset-password', sensitiveAuthLimiter, authController.resetPassword);

// Protected routes
router.post('/register', authenticateRequest, authorize('COORDINATOR'), authController.register);

// Protected — get own profile (includes PRN for students)
router.get('/me', authenticateToken, authController.getMe as any);

export default router;
