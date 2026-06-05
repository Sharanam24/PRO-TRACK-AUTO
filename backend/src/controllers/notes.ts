import { Request, Response } from 'express';
import { query } from '../config/database.js';

export const getNote = async (req: Request, res: Response): Promise<void> => {
    try {
        const user_id = (req as any).user.user_id;
        const result = await query(
            `SELECT * FROM student_notes WHERE student_id = $1`,
            [user_id]
        );
        res.json((result as any[])[0] || null);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
};

export const saveNote = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content } = req.body;
        const user_id = (req as any).user.user_id;
        
        // Upsert logic
        const existing = await query(`SELECT * FROM student_notes WHERE student_id = $1`, [user_id]);
        if ((existing as any[]).length > 0) {
            const result = await query(
                `UPDATE student_notes SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2 RETURNING *`,
                [content, user_id]
            );
            res.json((result as any[])[0]);
        } else {
            const result = await query(
                `INSERT INTO student_notes (student_id, content) VALUES ($1, $2) RETURNING *`,
                [user_id, content]
            );
            res.status(201).json((result as any[])[0]);
        }
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).json({ error: 'Failed to save note' });
    }
};
