import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import taskService from '../services/taskService';
import { TaskCategory, TaskStatus } from '@prisma/client';

interface UpdateTaskData {
  title?: string;
  description?: string;
  category?: TaskCategory;
  targetDate?: Date;
}

export class TaskController {
  // Create a new task
  async createTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, description, category, targetDate } = req.body;
      const userId = req.userId!;

      // Validation
      if (!title || !category || !targetDate) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: title, category, targetDate',
        });
        return;
      }

      if (!Object.values(TaskCategory).includes(category)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid category. Must be RED, YELLOW, or GREEN',
        });
        return;
      }

      const task = await taskService.createTask(
        userId,
        title,
        category,
        new Date(targetDate),
        description
      );

      res.status(201).json({
        status: 'success',
        data: task,
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create task',
      });
    }
  }

  // Get tasks
  async getTasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { targetDate, status } = req.query;

      const tasks = await taskService.getTasks(
        userId,
        targetDate ? new Date(targetDate as string) : undefined,
        status as TaskStatus | undefined
      );

      res.status(200).json({
        status: 'success',
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve tasks',
      });
    }
  }

  // Get single task
  async getTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.userId!;

      const task = await taskService.getTaskById(id, userId);

      if (!task) {
        res.status(404).json({
          status: 'error',
          message: 'Task not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: task,
      });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve task',
      });
    }
  }

  // Update task
  async updateTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.userId!;
      const { title, description, category, targetDate } = req.body;

      const updateData: UpdateTaskData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) {
        if (!Object.values(TaskCategory).includes(category)) {
          res.status(400).json({
            status: 'error',
            message: 'Invalid category',
          });
          return;
        }
        updateData.category = category;
      }
      if (targetDate !== undefined) updateData.targetDate = new Date(targetDate);

      const task = await taskService.updateTask(id, userId, updateData);

      res.status(200).json({
        status: 'success',
        data: task,
      });
    } catch (error) {
      console.error('Update task error:', error);
      if (error instanceof Error && error.message === 'Task not found or unauthorized') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to update task',
      });
    }
  }

  // Toggle task completion
  async toggleCompletion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.userId!;

      const task = await taskService.toggleTaskCompletion(id, userId);

      res.status(200).json({
        status: 'success',
        message: task.status === TaskStatus.COMPLETED ? 'Task completed!' : 'Task marked as active',
        data: task,
      });
    } catch (error) {
      console.error('Toggle completion error:', error);
      if (error instanceof Error && error.message === 'Task not found or unauthorized') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to toggle task completion',
      });
    }
  }

  // Archive task
  async archiveTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.userId!;

      const task = await taskService.archiveTask(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Task archived',
        data: task,
      });
    } catch (error) {
      console.error('Archive task error:', error);
      if (error instanceof Error && error.message === 'Task not found or unauthorized') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to archive task',
      });
    }
  }

  // Restore task
  async restoreTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.userId!;

      const task = await taskService.restoreTask(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Task restored',
        data: task,
      });
    } catch (error) {
      console.error('Restore task error:', error);
      if (error instanceof Error && error.message === 'Task not found or unauthorized') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to restore task',
      });
    }
  }

  // Delete task
  async deleteTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.userId!;

      await taskService.deleteTask(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Task deleted permanently',
      });
    } catch (error) {
      console.error('Delete task error:', error);
      if (error instanceof Error && error.message === 'Task not found or unauthorized') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete task',
      });
    }
  }
}

export default new TaskController();