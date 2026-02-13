import dotenv from 'dotenv';
dotenv.config();

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import userService from '../services/userService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Get or create user in our database
    await userService.getOrCreateUser(
      user.id,
      user.email!,
      user.user_metadata?.name || user.email?.split('@')[0]
    );

    // Attach userId to request
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};