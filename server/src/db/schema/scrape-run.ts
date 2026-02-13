import {
  pgTable,
  uuid,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { scrapeRunStatusEnum, scrapeRunTypeEnum } from './enums.js';
import type { ScrapeError } from '../../types/api.js';

export const scrapeRun = pgTable(
  'scrape_run',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runType: scrapeRunTypeEnum('run_type').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: scrapeRunStatusEnum('status').notNull().default('running'),
    trackingListsProcessed: integer('tracking_lists_processed').default(0),
    listingsFound: integer('listings_found').default(0),
    listingsNew: integer('listings_new').default(0),
    listingsUpdated: integer('listings_updated').default(0),
    listingsDelisted: integer('listings_delisted').default(0),
    errors: jsonb('errors').$type<ScrapeError[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_scrape_run_date').on(table.startedAt),
    index('idx_scrape_run_status').on(table.status),
  ]
);
