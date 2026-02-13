import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import summaryService from '../services/summaryService';

export class SummaryController {
  // Get summary for a specific date
  async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required parameter: date',
        });
        return;
      }

      const targetDate = new Date(date as string);

      const summary = await summaryService.getSummary(userId, targetDate);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get summary',
      });
    }
  }

  // Force regenerate summary
  async regenerateSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { date } = req.body;

      if (!date) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required field: date',
        });
        return;
      }

      const targetDate = new Date(date);

      const summary = await summaryService.regenerateSummary(userId, targetDate);

      res.status(200).json({
        status: 'success',
        message: 'Summary regenerated successfully',
        data: summary,
      });
    } catch (error) {
      console.error('Regenerate summary error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to regenerate summary',
      });
    }
  }
}

export default new SummaryController();