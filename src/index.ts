import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authenticate, AuthRequest } from './middleware/auth';
import taskRoutes from './routes/taskRoutes';
import prisma from './config/database';
import summaryRoutes from './routes/summaryRoutes';
import profileRoutes from './routes/profileRoutes';
import cronService from './services/cronService';

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

// Task routes
app.use('/api/tasks', taskRoutes);

// Summary routes
app.use('/api/summary', summaryRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Manual rollover trigger (for testing)
app.post('/api/admin/trigger-rollover', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await cronService.triggerManualRollover();

    res.status(200).json({
      status: 'success',
      message: 'Daily rollover completed successfully',
    });
  } catch (error) {
    console.error('Manual rollover error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to trigger rollover',
    });
  }
});

// Cleanup test endpoint (REMOVE IN PRODUCTION)
app.delete('/api/admin/cleanup-snapshots', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.dailySnapshot.deleteMany({
      where: { userId: req.userId }
    });

    res.status(200).json({
      status: 'success',
      message: 'Snapshots deleted',
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cleanup',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  cronService.startDailyRollover();
});