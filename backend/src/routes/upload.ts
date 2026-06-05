import { Router } from 'express';
import multer from 'multer';
import { authenticateRequest } from '../middleware/auth.js';
import * as storageService from '../services/storageService.js';

// Use memory storage so we get req.file.buffer for S3 or local writes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'image/jpeg',
            'image/png'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOCX, JPG, and PNG are allowed.'));
        }
    }
});

const router = Router();

// All routes require authentication
router.use(authenticateRequest);

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const fileUrl = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        res.status(200).json({
            message: 'File uploaded successfully',
            file_url: fileUrl,
            url: fileUrl, // backward compatibility
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', code: 'UPLOAD_FAILED' });
    }
});

export default router;
