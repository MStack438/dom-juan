import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as dashboardService from '../services/dashboard/dashboard.service.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch summary',
      },
    });
  }
});

router.get('/activity', async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const activity = await dashboardService.getActivityFeed(limit);
    res.json(activity);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch activity',
      },
    });
  }
});

export default router;
