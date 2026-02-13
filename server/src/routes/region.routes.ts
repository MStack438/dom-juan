import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { db } from '../db/index.js';
import { region } from '../db/schema/region.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const regions = await db.select().from(region).orderBy(region.name);
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
