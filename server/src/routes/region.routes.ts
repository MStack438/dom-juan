import { Router, type Request, type Response } from 'express';
import { db } from '../db/index.js';
import { region } from '../db/schema/region.js';
import { eq, ilike, and } from 'drizzle-orm';

const router = Router();

// Regions are public reference data - no authentication required

router.get('/', async (req: Request, res: Response) => {
  try {
    const { level, search } = req.query;

    let query = db.select().from(region);

    // Filter conditions
    const conditions = [];

    if (level !== undefined) {
      const levelNum = parseInt(level as string, 10);
      if (!isNaN(levelNum)) {
        conditions.push(eq(region.level, levelNum));
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      conditions.push(ilike(region.name, `%${search.trim()}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const regions = await query.orderBy(region.name);
    res.json(regions);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch regions',
      },
    });
  }
});

router.get('/tree', async (_req: Request, res: Response) => {
  try {
    const regions = await db
      .select()
      .from(region)
      .orderBy(region.level, region.name);
    const byParent = new Map<string | null, typeof regions>();
    for (const r of regions) {
      const key = r.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    }
    function buildTree(parentId: string | null): unknown[] {
      const children = byParent.get(parentId) ?? [];
      return children.map((r) => ({
        ...r,
        children: buildTree(r.id),
      }));
    }
    res.json(buildTree(null));
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch region tree',
      },
    });
  }
});

export default router;
