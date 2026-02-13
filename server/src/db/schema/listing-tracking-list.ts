import {
  pgTable,
  uuid,
  boolean,
  timestamp,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listing } from './listing.js';
import { trackingList } from './tracking-list.js';

export const listingTrackingList = pgTable(
  'listing_tracking_list',
  {
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listing.id, { onDelete: 'cascade' }),
    trackingListId: uuid('tracking_list_id')
      .notNull()
      .references(() => trackingList.id, { onDelete: 'cascade' }),
    firstMatchedAt: timestamp('first_matched_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    primaryKey({ columns: [table.listingId, table.trackingListId] }),
    index('idx_ltl_tracking_list').on(table.trackingListId, table.isActive),
    index('idx_ltl_listing').on(table.listingId),
  ]
);

export const listingTrackingListRelations = relations(
  listingTrackingList,
  ({ one }) => ({
    listing: one(listing),
    trackingList: one(trackingList),
  })
);
