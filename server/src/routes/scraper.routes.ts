import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { db } from '../db/index.js';
import { scrapeRun } from '../db/schema/scrape-run.js';
import { eq, desc } from 'drizzle-orm';
import {
  startScrapeRun,
  executeScrapeRun,
  isScrapeRunning,
} from '../services/scraper/scraper.service.js';

const router = Router();

router.use(requireAuth);

router.post('/run', async (_req: Request, res: Response) => {
  try {
    const running = await isScrapeRunning();
    if (running) {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'A scrape is already running',
        },
      });
      return;
    }
    const runId = await startScrapeRun('manual');
    executeScrapeRun(runId).catch((err) => {
      console.error('[Scraper] Run failed:', err);
    });
    res.status(202).json({ id: runId });
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to start scrape',
      },
    });
  }
});

router.get('/runs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const runs = await db
      .select()
      .from(scrapeRun)
      .orderBy(desc(scrapeRun.startedAt))
      .limit(limit);
    res.json(runs);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch scrape runs',
      },
    });
  }
});

router.get('/runs/:id', async (req: Request, res: Response) => {
  try {
    const [run] = await db
      .select()
      .from(scrapeRun)
      .where(eq(scrapeRun.id, req.params.id))
      .limit(1);
    if (!run) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Scrape run not found' },
      });
      return;
    }
    res.json(run);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch scrape run',
      },
    });
  }
});

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const running = await isScrapeRunning();
    const [runningRun] = await db
      .select()
      .from(scrapeRun)
      .where(eq(scrapeRun.status, 'running'))
      .limit(1);
    const [lastRun] = await db
      .select()
      .from(scrapeRun)
      .orderBy(desc(scrapeRun.startedAt))
      .limit(1);
    res.json({
      running,
      currentRun: runningRun ?? undefined,
      lastRun: lastRun ?? undefined,
    });
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch scraper status',
      },
    });
  }
});

export default router;
