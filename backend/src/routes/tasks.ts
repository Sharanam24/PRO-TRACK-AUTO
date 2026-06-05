import { Router } from 'express';
import { authenticateRequest } from '../middleware/auth.js';
import { getTasks, createTask, updateTaskStatus, deleteTask } from '../controllers/tasks.js';

const router = Router();

router.use(authenticateRequest);

router.get('/:group_id', getTasks);
router.post('/', createTask);
router.put('/:task_id', updateTaskStatus);
router.delete('/:task_id', deleteTask);

export default router;
