import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import summaryController from '../controllers/summaryController';

const router = Router();

// All routes are protected
router.use(authenticate);

// Get summary for a specific date
router.get('/', summaryController.getSummary.bind(summaryController));

// Force regenerate summary
router.post('/regenerate', summaryController.regenerateSummary.bind(summaryController));

export default router;