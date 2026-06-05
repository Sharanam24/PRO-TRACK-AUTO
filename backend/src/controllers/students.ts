import { Request, Response } from 'express';
import { mockStudents } from '../models/index.js';

export const getAllStudents = (req: Request, res: Response) => {
    res.json({ students: mockStudents, total: mockStudents.length });
};

export const getStudentById = (req: Request, res: Response) => {
    const { id } = req.params;
    const student = mockStudents.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student });
};

export const createStudent = (req: Request, res: Response) => {
    const { email, name, department, enrollment, semester, advisor } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: 'Email and name required' });
    }

    const newStudent = {
        id: String(mockStudents.length + 1),
        email,
        name,
        role: 'student' as const,
        department,
        enrollment,
        semester,
        advisor,
        createdAt: new Date()
    };

    mockStudents.push(newStudent);
    res.status(201).json({ student: newStudent });
};

export const updateStudent = (req: Request, res: Response) => {
    const { id } = req.params;
    const studentIndex = mockStudents.findIndex(s => s.id === id);

    if (studentIndex === -1) {
        return res.status(404).json({ error: 'Student not found' });
    }

    mockStudents[studentIndex] = {
        ...mockStudents[studentIndex],
        ...req.body
    };

    res.json({ student: mockStudents[studentIndex] });
};

export const deleteStudent = (req: Request, res: Response) => {
    const { id } = req.params;
    const studentIndex = mockStudents.findIndex(s => s.id === id);

    if (studentIndex === -1) {
        return res.status(404).json({ error: 'Student not found' });
    }

    const deleted = mockStudents.splice(studentIndex, 1);
    res.json({ success: true, student: deleted[0] });
};
