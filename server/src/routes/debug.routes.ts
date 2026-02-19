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

// Debug endpoint to check Playwright installation and run full test
router.get('/playwright-test', async (_req: Request, res: Response) => {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 4,
    },
  };

  // Test 1: Module import
  results.tests.push({ name: 'Module Import', status: 'running' });
  try {
    const pw = await import('playwright');
    results.tests[0] = {
      name: 'Module Import',
      status: 'passed',
      details: `Version: ${pw.chromium.name()}`,
    };
    results.summary.passed++;
  } catch (error) {
    results.tests[0] = {
      name: 'Module Import',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
    results.summary.failed++;
    return res.json(results);
  }

  // Test 2: Chromium import
  results.tests.push({ name: 'Chromium Import', status: 'running' });
  let chromium: any;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
    results.tests[1] = {
      name: 'Chromium Import',
      status: 'passed',
    };
    results.summary.passed++;
  } catch (error) {
    results.tests[1] = {
      name: 'Chromium Import',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
    results.summary.failed++;
    return res.json(results);
  }

  // Test 3: Executable path
  results.tests.push({ name: 'Executable Path', status: 'running' });
  let executablePath = '';
  try {
    executablePath = chromium.executablePath();
    const fs = await import('fs');
    const exists = fs.existsSync(executablePath);

    results.tests[2] = {
      name: 'Executable Path',
      status: exists ? 'passed' : 'failed',
      details: {
        path: executablePath,
        exists,
      },
    };
    if (exists) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      return res.json(results);
    }
  } catch (error) {
    results.tests[2] = {
      name: 'Executable Path',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
    results.summary.failed++;
    return res.json(results);
  }

  // Test 4: Browser launch
  results.tests.push({ name: 'Browser Launch', status: 'running' });
  let browser: any = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('data:text/html,<h1>Test</h1>');
    await browser.close();

    results.tests[3] = {
      name: 'Browser Launch',
      status: 'passed',
      details: 'Browser launched, navigated, and closed successfully',
    };
    results.summary.passed++;
  } catch (error) {
    results.tests[3] = {
      name: 'Browser Launch',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
    results.summary.failed++;
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }

  // Overall status
  results.status = results.summary.failed === 0 ? 'success' : 'failure';
  results.message = results.summary.failed === 0
    ? '✅ Playwright is fully functional!'
    : `❌ ${results.summary.failed}/${results.summary.total} tests failed`;

  res.json(results);
});

export default router;
