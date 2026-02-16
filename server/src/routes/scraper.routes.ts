import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { db } from '../db/index.js';
import { scrapeRun } from '../db/schema/scrape-run.js';
import { region } from '../db/schema/region.js';
import { eq, desc } from 'drizzle-orm';
import {
  startScrapeRun,
  executeScrapeRun,
  isScrapeRunning,
} from '../services/scraper/scraper.service.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const router = Router();

// Seed endpoint doesn't require auth (idempotent, safe operation)
router.post('/seed-municipalities', async (_req: Request, res: Response) => {
  try {
    // Check if already seeded (has level 2 regions)
    const existing = await db
      .select()
      .from(region)
      .where(eq(region.level, 2))
      .limit(1);

    if (existing.length > 0) {
      // Already seeded, return success
      const counts = await Promise.all([
        db.select().from(region).where(eq(region.level, 0)),
        db.select().from(region).where(eq(region.level, 1)),
        db.select().from(region).where(eq(region.level, 2)),
      ]);

      res.json({
        message: 'Municipalities already seeded',
        counts: {
          adminRegions: counts[0].length,
          mrcs: counts[1].length,
          municipalities: counts[2].length,
        },
      });
      return;
    }

    // Run the seed script
    const { stdout, stderr } = await execAsync('npm run db:seed-municipalities');

    if (stderr && !stderr.includes('npm warn')) {
      console.error('[Seed] stderr:', stderr);
    }

    console.log('[Seed] stdout:', stdout);

    // Get final counts
    const counts = await Promise.all([
      db.select().from(region).where(eq(region.level, 0)),
      db.select().from(region).where(eq(region.level, 1)),
      db.select().from(region).where(eq(region.level, 2)),
    ]);

    res.json({
      message: 'Municipalities seeded successfully',
      counts: {
        adminRegions: counts[0].length,
        mrcs: counts[1].length,
        municipalities: counts[2].length,
      },
    });
  } catch (err) {
    console.error('[Seed] Error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to seed municipalities',
      },
    });
  }
});

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
