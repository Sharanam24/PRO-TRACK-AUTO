import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve uploads directory relative to this file (../../uploads from src/services/)
const uploadsDir = path.resolve(__dirname, '../../uploads');

export async function uploadFile(buffer: Buffer, originalname: string, mimetype: string): Promise<string> {
    const S3_BUCKET = process.env.S3_BUCKET;
    const S3_REGION = process.env.S3_REGION;
    const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
    const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

    // If all S3 config vars are present, upload to S3
    if (S3_BUCKET && S3_REGION && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY) {
        const client = new S3Client({
            region: S3_REGION,
            credentials: {
                accessKeyId: S3_ACCESS_KEY_ID,
                secretAccessKey: S3_SECRET_ACCESS_KEY,
            },
        });

        const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}-${originalname}`;

        try {
            await client.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: mimetype,
            }));
        } catch (err) {
            console.error('[storageService] S3 upload failed', err);
            throw err;
        }

        return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
    }

    // Local fallback: write buffer to uploads directory
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${originalname}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${filename}`;
}
