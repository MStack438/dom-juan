import { Router, type Request, type Response } from 'express';
import { db } from '../db/index.js';
import { region } from '../db/schema/region.js';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Debug endpoint to check database state
router.get('/db-status', async (_req: Request, res: Response) => {
  try {
    // Test connection
    await db.execute(sql`SELECT 1`);

    // Count regions by level
    const level0Count = await db.select({ count: sql<number>`count(*)` })
      .from(region)
      .where(eq(region.level, 0));

    const level1Count = await db.select({ count: sql<number>`count(*)` })
      .from(region)
      .where(eq(region.level, 1));

    const level2Count = await db.select({ count: sql<number>`count(*)` })
      .from(region)
      .where(eq(region.level, 2));

    // Get sample municipalities
    const sampleMunicipalities = await db.select()
      .from(region)
      .where(eq(region.level, 2))
      .limit(10);

    res.json({
      status: 'connected',
      regions: {
        level0_admin_regions: level0Count[0]?.count ?? 0,
        level1_mrcs: level1Count[0]?.count ?? 0,
        level2_municipalities: level2Count[0]?.count ?? 0,
      },
      sampleMunicipalities: sampleMunicipalities.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
      })),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Debug endpoint to check Playwright installation
router.get('/playwright-status', async (_req: Request, res: Response) => {
  try {
    // Try to import Playwright
    const pw = await import('playwright');
    const chromium = pw.chromium;

    // Try to get executable path
    let executablePath = 'unknown';
    let launchable = false;
    let error: string | null = null;

    try {
      executablePath = chromium.executablePath();

      // Try to launch browser
      const browser = await chromium.launch({ headless: true });
      await browser.close();
      launchable = true;
    } catch (launchError) {
      error = launchError instanceof Error ? launchError.message : 'Unknown launch error';
    }

    res.json({
      status: 'ok',
      playwright: {
        installed: true,
        executablePath,
        launchable,
        error,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      playwright: {
        installed: false,
        error: err instanceof Error ? err.message : 'Playwright not available',
      },
    });
  }
});

export default router;
