import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import type { TrackingCriteria } from '../../types/criteria.js';

export const trackingList = pgTable(
  'tracking_list',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    source: varchar('source', { length: 20 }).notNull().default('realtor'), // 'realtor' or 'centris'
    criteria: jsonb('criteria').$type<TrackingCriteria>().notNull().default({}),
    customUrl: text('custom_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_tracking_list_active').on(table.isActive)]
);
