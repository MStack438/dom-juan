import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listingStatusEnum } from './enums.js';
import { listing } from './listing.js';

export const snapshot = pgTable(
  'snapshot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listing.id, { onDelete: 'cascade' }),
    capturedAt: timestamp('captured_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    price: integer('price').notNull(),
    status: listingStatusEnum('status').notNull(),
    photoCount: integer('photo_count'),
    isFeatured: boolean('is_featured').default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_snapshot_listing_date').on(table.listingId, table.capturedAt),
    index('idx_snapshot_captured').on(table.capturedAt),
  ]
);

export const snapshotRelations = relations(snapshot, ({ one }) => ({
  listing: one(listing),
}));
