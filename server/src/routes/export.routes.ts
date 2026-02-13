import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as exportService from '../services/export/export.service.js';
import * as trackingListService from '../services/tracking-list/tracking-list.service.js';
import * as listingService from '../services/listing/listing.service.js';

const router = Router();

router.use(requireAuth);

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80) || 'export';
}

router.get('/tracking-list/:id', async (req: Request, res: Response) => {
  try {
    const list = await trackingListService.getTrackingListById(req.params.id);
    if (!list) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Tracking list not found' },
      });
      return;
    }
    const csv = await exportService.getTrackingListCsv(req.params.id);
    const filename = `tracking-list-${safeFilename(list.name)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to export CSV',
      },
    });
  }
});

router.get('/snapshots/:listingId', async (req: Request, res: Response) => {
  try {
    const listing = await listingService.getListingById(req.params.listingId);
    if (!listing) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Listing not found' },
      });
      return;
    }
    const csv = await exportService.getSnapshotsCsv(req.params.listingId);
    const filename = `snapshots-${listing.mlsNumber}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          err instanceof Error ? err.message : 'Failed to export CSV',
      },
    });
  }
});

export default router;
