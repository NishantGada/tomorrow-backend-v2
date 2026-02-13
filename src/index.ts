import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authenticate, AuthRequest } from './middleware/auth';
import taskRoutes from './routes/taskRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Tomorrow API is running! 🚀',
    timestamp: new Date().toISOString()
  });
});

// Protected route - test authentication route
app.get('/api/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Authentication successful!',
    userId: req.userId
  });
});

// Task routes
app.use('/api/tasks', taskRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});