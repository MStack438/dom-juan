import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as dashboardService from '../services/dashboard/dashboard.service.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.json(summary);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Dashboard summary]', err instanceof Error ? err.message : err);
    }
    next(err);
  }
});

router.get('/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const activity = await dashboardService.getActivityFeed(limit);
    res.json(activity);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Dashboard activity]', err instanceof Error ? err.message : err);
    }
    next(err);
  }
});

export default router;
