import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
const regionTable = pgTable(
  'region',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    parentId: uuid('parent_id'),
    urlFragment: varchar('url_fragment', { length: 255 }),
    level: integer('level').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_region_parent').on(table.parentId),
    index('idx_region_code').on(table.code),
  ]
);

export const region = regionTable;
