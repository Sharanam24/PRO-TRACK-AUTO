import { Router } from 'express';
import * as authController from '../controllers/auth.js';
import { authenticateToken } from '../utils/jwt.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/claim-account', authController.claimAccount);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/register', authenticateRequest, authorize('COORDINATOR'), authController.register);

// Protected — get own profile (includes PRN for students)
router.get('/me', authenticateToken, authController.getMe as any);

export default router;
