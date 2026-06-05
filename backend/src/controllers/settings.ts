import { Request, Response } from 'express';
import { pool } from '../config/database.js';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT key, value FROM global_settings');
        const settings: Record<string, any> = {};
        for (const row of result.rows) {
            settings[row.key] = row.value;
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    const { key, value } = req.body;
    try {
        await pool.query(
            'INSERT INTO global_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [key, JSON.stringify(value)]
        );
        res.json({ message: 'Settings updated' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
