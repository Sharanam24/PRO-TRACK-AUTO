import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import groupRoutes from './routes/groups.js';
import notificationRoutes from './routes/notifications.js';
import whitelistRoutes from './routes/whitelist.js';
import evaluationRoutes from './routes/evaluations.js';
import uploadRoutes from './routes/upload.js';
import scheduleRoutes from './routes/schedules.js';
import { chatRouter } from './routes/chat.js';
import { cronTasksRouter } from './routes/cronTasks.js';
import tasksRoutes from './routes/tasks.js';
import peerEvaluationRoutes from './routes/peerEvaluations.js';
import resourcesRoutes from './routes/resources.js';
import notesRoutes from './routes/notes.js';
import settingsRoutes from './routes/settings.js';
import analyticsRoutes from './routes/analytics.js';
import coordinatorActionRoutes from './routes/coordinator.js';
import rubricsRoutes from './routes/rubrics.js';
import committeeRoutes from './routes/committee.js';
import allocationRoutes from './routes/allocations.js';
import mappingRoutes from './routes/mappings.js';
import milestoneRoutes from './routes/milestones.js';
import reportsRoutes from './routes/reports.js';
import { initCronJobs } from './cron/reminders.js';
import { initChatSocket } from './socket/chatSocket.js';
import { setSocketIo } from './services/notificationService.js';
import { initEmbeddingModel, isReady as isEmbeddingReady } from './services/ml/embeddingService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Allow any localhost port for CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const CORS_ORIGIN = /localhost/.test(corsOrigin) ? /localhost/ : corsOrigin;

// Socket.IO attached to the same HTTP server (Requirement 7.1, 7.9)
export const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        ml_status: isEmbeddingReady() ? 'ready' : 'loading',
    });
});

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coordinator/whitelist', whitelistRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/coordinator', cronTasksRouter);
app.use('/api/coordinator/action', coordinatorActionRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/peer-evaluations', peerEvaluationRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rubrics', rubricsRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/mappings', mappingRoutes);
app.use('/api/groups/:group_id/milestones', milestoneRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler — must come before global error handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.path,
    });
});

// Global error handling middleware — emits standard structure for ALL errors
app.use((err: Error & { status?: number; statusCode?: number; code?: string }, req: Request, res: Response, _next: NextFunction) => {
    // Always log the full stack trace server-side
    console.error(`[ERROR] ${req.method} ${req.path}`, err.stack ?? err);

    const status = err.status ?? err.statusCode ?? 500;
    const path = req.path;
    const timestamp = new Date().toISOString();

    // Determine error code from HTTP status or explicit code
    let code: string;
    if (err.code === 'UNAUTHORIZED' || status === 401) {
        code = 'UNAUTHORIZED';
    } else if (err.code === 'FORBIDDEN' || status === 403) {
        code = 'FORBIDDEN';
    } else if (err.code === 'NOT_FOUND' || status === 404) {
        code = 'NOT_FOUND';
    } else if (err.code === 'CONFLICT' || status === 409) {
        code = 'CONFLICT';
    } else if (err.code === 'VALIDATION_ERROR' || status === 422) {
        code = 'VALIDATION_ERROR';
    } else {
        code = err.code ?? 'INTERNAL_ERROR';
    }

    // Never expose stack trace in response body
    res.status(status).json({
        error: err.message || 'Internal Server Error',
        code,
        timestamp,
        path,
    });
});

// Initialize server
async function startServer() {
    try {
        // Warn about optional unconfigured services
        if (!process.env.SMTP_HOST) {
            console.warn('[WARN] SMTP not configured — email verification and password reset emails will not be sent. Set SMTP_HOST in .env to enable.');
        }
        if (!process.env.REDIS_URL) {
            console.warn('[WARN] Redis not configured — analytics caching is disabled. Set REDIS_URL in .env to enable.');
        }
        if (!process.env.S3_BUCKET) {
            console.warn('[WARN] S3 not configured — file uploads will use local disk storage. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY in .env to enable.');
        }

        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠ Warning: Database connection failed. Please ensure PostgreSQL is running and the database is initialized.');
            console.log('Run: npm run db:init');
        }

        httpServer.listen(PORT, () => {
            console.log(`✓ ProTrack-Auto backend running on http://localhost:${PORT}`);
            console.log(`✓ CORS enabled for ${CORS_ORIGIN}`);
            console.log(`✓ API docs available at http://localhost:${PORT}/api/docs`);

            // Initialize Socket.IO chat handlers
            initChatSocket(io);

            // Wire Socket.IO into notification service for badge push (Requirement 11.1)
            setSocketIo(io);

            // Initialize background cron jobs
            initCronJobs();
        });

        // Kick off model loading non-blocking (Requirement 14.1, 19.5)
        initEmbeddingModel().then(() => {
            console.log('[EmbeddingService] Model ready and available.');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
