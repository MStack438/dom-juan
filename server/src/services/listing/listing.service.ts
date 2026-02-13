import { db } from '../../db/index.js';
import { listing } from '../../db/schema/listing.js';
import { listingTrackingList } from '../../db/schema/listing-tracking-list.js';
import { snapshot } from '../../db/schema/snapshot.js';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';

export async function getListingsByTrackingList(
  trackingListId: string,
  options: {
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    priceMin?: number;
    priceMax?: number;
  } = {}
) {
  const {
    status = 'active',
    sort = 'dom',
    order = 'desc',
    priceMin,
    priceMax,
  } = options;

  const joinCondition = and(
    eq(listing.id, listingTrackingList.listingId),
    eq(listingTrackingList.trackingListId, trackingListId),
    eq(listingTrackingList.isActive, true)
  );

  const whereParts: ReturnType<typeof eq>[] = [];
  if (status !== 'all') {
    whereParts.push(
      eq(listing.status, status as 'active' | 'delisted' | 'sold' | 'expired' | 'unknown')
    );
  }
  if (priceMin != null) whereParts.push(gte(listing.currentPrice, priceMin));
  if (priceMax != null) whereParts.push(lte(listing.currentPrice, priceMax));
  const whereCondition =
    whereParts.length > 0 ? and(...whereParts) : undefined;

  const direction = order === 'asc' ? asc : desc;

  if (sort === 'price') {
    const rows = await db
      .select({ listing })
      .from(listing)
      .innerJoin(listingTrackingList, joinCondition)
      .where(whereCondition)
      .orderBy(direction(listing.currentPrice));
    return rows.map((r) => r.listing);
  }

  if (sort === 'date') {
    const rows = await db
      .select({ listing })
      .from(listing)
      .innerJoin(listingTrackingList, joinCondition)
      .where(whereCondition)
      .orderBy(direction(listing.firstSeenAt));
    return rows.map((r) => r.listing);
  }

  const domExpr = sql`(${listing.lastSeenAt}::timestamp - ${listing.firstSeenAt}::timestamp)`;
  const rows = await db
    .select({ listing })
    .from(listing)
    .innerJoin(listingTrackingList, joinCondition)
    .where(whereCondition)
    .orderBy(direction(domExpr));
  return rows.map((r) => r.listing);
}

export async function getListingById(id: string) {
  const [row] = await db
    .select()
    .from(listing)
    .where(eq(listing.id, id))
    .limit(1);
  return row ?? null;
}

export async function getSnapshotsByListingId(listingId: string) {
  return db
    .select()
    .from(snapshot)
    .where(eq(snapshot.listingId, listingId))
    .orderBy(desc(snapshot.capturedAt));
}
