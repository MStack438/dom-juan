import { db } from '../../db/index.js';
import { trackingList } from '../../db/schema/tracking-list.js';
import { listing } from '../../db/schema/listing.js';
import { scrapeRun } from '../../db/schema/scrape-run.js';
import { eq, desc, sql } from 'drizzle-orm';

export async function getDashboardSummary() {
  const [listCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trackingList)
    .where(eq(trackingList.isActive, true));

  const [listingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listing)
    .where(eq(listing.status, 'active'));

  const [lastRun] = await db
    .select()
    .from(scrapeRun)
    .orderBy(desc(scrapeRun.startedAt))
    .limit(1);

  return {
    activeTrackingLists: listCount?.count ?? 0,
    activeListings: listingCount?.count ?? 0,
    lastScrapeRun: lastRun
      ? {
          id: lastRun.id,
          startedAt: lastRun.startedAt,
          completedAt: lastRun.completedAt,
          status: lastRun.status,
        }
      : null,
  };
}

export async function getActivityFeed(limit = 20) {
  const runs = await db
    .select()
    .from(scrapeRun)
    .orderBy(desc(scrapeRun.startedAt))
    .limit(limit);
  return runs.map((r) => ({
    type: 'scrape_run' as const,
    id: r.id,
    timestamp: r.startedAt,
    status: r.status,
    listingsNew: r.listingsNew,
    listingsUpdated: r.listingsUpdated,
    listingsDelisted: r.listingsDelisted,
  }));
}
