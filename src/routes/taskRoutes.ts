import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import taskController from '../controllers/taskController';

const router = Router();

// All routes are protected (require authentication)
router.use(authenticate);

// Create a new task
router.post('/', taskController.createTask.bind(taskController));

// Get all tasks (with optional filters)
router.get('/', taskController.getTasks.bind(taskController));

// Get single task by ID
router.get('/:id', taskController.getTask.bind(taskController));

// Update a task
router.patch('/:id', taskController.updateTask.bind(taskController));

// Toggle task completion
router.patch('/:id/complete', taskController.toggleCompletion.bind(taskController));

// Archive a task
router.patch('/:id/archive', taskController.archiveTask.bind(taskController));

// Restore archived task
router.patch('/:id/restore', taskController.restoreTask.bind(taskController));

// Delete task permanently
router.delete('/:id', taskController.deleteTask.bind(taskController));

export default router;