import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export function authenticateRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({
            error: 'Access token required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(401).json({
            error: 'Invalid or expired token',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
            path: req.path
        });
        return;
    }

    req.user = decoded;
    next();
}

export function authorize(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'User not authenticated',
                code: 'UNAUTHORIZED',
                timestamp: new Date().toISOString(),
                path: req.path
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                code: 'FORBIDDEN',
                timestamp: new Date().toISOString(),
                path: req.path
            });
            return;
        }

        next();
    };
}
