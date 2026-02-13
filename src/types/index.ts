import { Task, User, TaskCategory, TaskStatus } from '@prisma/client';

// Re-export Prisma types
export { Task, User, TaskCategory, TaskStatus };

// API Request types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  targetDate: string; // ISO
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  targetDate?: string;
}

export interface TaskResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  targetDate: string;
  completedAt: string | null;
  taskStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  profilePictureUrl: string | null;
  currentStreak: number;
  longestStreak: number;
}

export interface SummaryResponse {
  summary: string;
  targetDate: string;
  taskCount: number;
  createdAt: string;
}

// Authenticated request (after auth middleware)
export interface AuthRequest extends Express.Request {
  userId?: string;
}