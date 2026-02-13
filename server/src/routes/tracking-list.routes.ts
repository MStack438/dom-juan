import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as trackingListService from '../services/tracking-list/tracking-list.service.js';
import * as listingService from '../services/listing/listing.service.js';

const router = Router();

router.use(requireAuth);

router.get('/:id/listings', async (req: Request, res: Response) => {
  try {
    const { status, sort, order, priceMin, priceMax } = req.query as {
      status?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      priceMin?: string;
      priceMax?: string;
    };
    const priceMinNum = priceMin ? parseInt(priceMin, 10) : undefined;
    const priceMaxNum = priceMax ? parseInt(priceMax, 10) : undefined;
    const listings = await listingService.getListingsByTrackingList(
      req.params.id,
      {
        status,
        sort,
        order,
        priceMin: priceMinNum !== undefined && !isNaN(priceMinNum) ? priceMinNum : undefined,
        priceMax: priceMaxNum !== undefined && !isNaN(priceMaxNum) ? priceMaxNum : undefined,
      }
    );
    res.json(listings);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch listings',
      },
    });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const lists = await trackingListService.getAllTrackingLists();
    res.json(lists);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch tracking lists',
      },
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const list = await trackingListService.getTrackingListById(req.params.id);
    if (!list) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tracking list not found' },
      });
      return;
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch tracking list',
      },
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, criteria, custom_url: customUrl } = req.body as {
      name?: string;
      description?: string;
      criteria?: unknown;
      custom_url?: string;
    };
    if (!name || typeof name !== 'string') {
      res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'name is required' },
      });
      return;
    }
    const list = await trackingListService.createTrackingList({
      name,
      description,
      criteria: criteria as Parameters<typeof trackingListService.createTrackingList>[0]['criteria'],
      customUrl,
    });
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Failed to create tracking list',
      },
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, criteria, custom_url: customUrl } = req.body as {
      name?: string;
      description?: string;
      criteria?: unknown;
      custom_url?: string;
    };
    const updated = await trackingListService.updateTrackingList(req.params.id, {
      name,
      description,
      criteria: criteria as Parameters<typeof trackingListService.updateTrackingList>[1]['criteria'],
      customUrl,
    });
    if (!updated) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tracking list not found' },
      });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Failed to update tracking list',
      },
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await trackingListService.deleteTrackingList(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Failed to delete tracking list',
      },
    });
  }
});

router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const updated = await trackingListService.toggleTrackingList(req.params.id);
    if (!updated) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tracking list not found' },
      });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Failed to toggle tracking list',
      },
    });
  }
});

export default router;
