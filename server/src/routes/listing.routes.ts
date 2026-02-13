import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as listingService from '../services/listing/listing.service.js';

const router = Router();

router.use(requireAuth);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    if (!listing) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Listing not found' },
      });
      return;
    }
    res.json(listing);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch listing',
      },
    });
  }
});

router.get('/:id/snapshots', async (req: Request, res: Response) => {
  try {
    const snapshots = await listingService.getSnapshotsByListingId(
      req.params.id
    );
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to fetch snapshots',
      },
    });
  }
});

export default router;
