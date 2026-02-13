import { db } from '../../db/index.js';
import { trackingList } from '../../db/schema/tracking-list.js';
import { listingTrackingList } from '../../db/schema/listing-tracking-list.js';
import { listing } from '../../db/schema/listing.js';
import { eq, and, sql } from 'drizzle-orm';
import type { TrackingCriteria } from '../../types/criteria.js';

export async function getAllTrackingLists() {
  return db.select().from(trackingList).orderBy(trackingList.name);
}

export async function getTrackingListById(id: string) {
  const [row] = await db
    .select()
    .from(trackingList)
    .where(eq(trackingList.id, id))
    .limit(1);
  if (!row) return null;

  const [countResult] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${listing.status} = 'active')::int`,
    })
    .from(listingTrackingList)
    .innerJoin(listing, eq(listing.id, listingTrackingList.listingId))
    .where(
      and(
        eq(listingTrackingList.trackingListId, id),
        eq(listingTrackingList.isActive, true)
      )
    );

  return {
    ...row,
    listingCount: countResult?.total ?? 0,
    activeCount: countResult?.active ?? 0,
  };
}

export async function createTrackingList(data: {
  name: string;
  description?: string;
  criteria?: TrackingCriteria;
  customUrl?: string;
}) {
  const [created] = await db
    .insert(trackingList)
    .values({
      name: data.name,
      description: data.description ?? null,
      criteria: (data.criteria ?? {}) as TrackingCriteria,
      customUrl: data.customUrl ?? null,
    })
    .returning();
  return created;
}

export async function updateTrackingList(
  id: string,
  data: {
    name?: string;
    description?: string;
    criteria?: TrackingCriteria;
    customUrl?: string;
  }
) {
  const [updated] = await db
    .update(trackingList)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(trackingList.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteTrackingList(id: string) {
  await db.delete(trackingList).where(eq(trackingList.id, id));
}

export async function toggleTrackingList(id: string) {
  const [row] = await db
    .select({ isActive: trackingList.isActive })
    .from(trackingList)
    .where(eq(trackingList.id, id))
    .limit(1);
  if (!row) return null;
  const [updated] = await db
    .update(trackingList)
    .set({
      isActive: !row.isActive,
      updatedAt: new Date(),
    })
    .where(eq(trackingList.id, id))
    .returning();
  return updated ?? null;
}
