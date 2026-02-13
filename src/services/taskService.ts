import prisma from '../config/database';
import { TaskCategory, TaskStatus } from '@prisma/client';

export class TaskService {
  // Create a new task
  async createTask(
    userId: string,
    title: string,
    category: TaskCategory,
    targetDate: Date,
    description?: string
  ) {
    return await prisma.task.create({
      data: {
        userId,
        title,
        description,
        category,
        targetDate,
        status: TaskStatus.ACTIVE,
      },
    });
  }

  // Get all tasks for a user (filtered by date and status)
  async getTasks(
    userId: string,
    targetDate?: Date,
    status?: TaskStatus
  ) {
    const where: {
      userId: string;
      targetDate?: {
        gte: Date;
        lte: Date;
      };
      status?: TaskStatus;
    } = { userId };

    if (targetDate) {
      // Get tasks for specific date (beginning to end of day)
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.targetDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status) {
      where.status = status;
    }

    return await prisma.task.findMany({
      where,
      orderBy: [
        { category: 'asc' }, // RED first, then YELLOW, then GREEN
        { createdAt: 'desc' },
      ],
    });
  }

  // Get single task by ID
  async getTaskById(taskId: string, userId: string) {
    return await prisma.task.findFirst({
      where: {
        id: taskId,
        userId, // Ensure user owns this task
      },
    });
  }

  // Update a task
  async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      category?: TaskCategory;
      targetDate?: Date;
    }
  ) {
    // First verify user owns this task
    const task = await this.getTaskById(taskId, userId);
    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    return await prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  // Mark task as complete/incomplete
  async toggleTaskCompletion(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);
    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    const isCompleting = task.status !== TaskStatus.COMPLETED;

    return await prisma.task.update({
      where: { id: taskId },
      data: {
        status: isCompleting ? TaskStatus.COMPLETED : TaskStatus.ACTIVE,
        completedAt: isCompleting ? new Date() : null,
        taskStreak: isCompleting ? task.taskStreak + 1 : task.taskStreak,
      },
    });
  }

  // Archive a task
  async archiveTask(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);
    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.ARCHIVED,
      },
    });
  }

  // Restore archived task
  async restoreTask(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);
    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.ACTIVE,
      },
    });
  }

  // Delete a task permanently
  async deleteTask(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);
    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    return await prisma.task.delete({
      where: { id: taskId },
    });
  }
}

export default new TaskService();