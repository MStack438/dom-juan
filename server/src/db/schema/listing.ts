import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import {
  propertyTypeEnum,
  listingStatusEnum,
  basementTypeEnum,
  poolTypeEnum,
} from './enums.js';
import { region } from './region.js';

export const listing = pgTable(
  'listing',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mlsNumber: varchar('mls_number', { length: 50 }).unique().notNull(),
    sourceUrl: text('source_url').notNull(),
    regionId: uuid('region_id').references(() => region.id, {
      onDelete: 'set null',
    }),
    address: varchar('address', { length: 500 }).notNull(),
    municipality: varchar('municipality', { length: 255 }),
    postalCode: varchar('postal_code', { length: 10 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastDetailScrapeAt: timestamp('last_detail_scrape_at', {
      withTimezone: true,
    }),
    delistedAt: timestamp('delisted_at', { withTimezone: true }),
    originalPrice: integer('original_price').notNull(),
    currentPrice: integer('current_price').notNull(),
    priceChangeCount: integer('price_change_count').notNull().default(0),
    status: listingStatusEnum('status').notNull().default('active'),
    propertyType: propertyTypeEnum('property_type'),
    yearBuilt: integer('year_built'),
    lotSizeSqft: integer('lot_size_sqft'),
    lotDimensions: varchar('lot_dimensions', { length: 100 }),
    livingAreaSqft: integer('living_area_sqft'),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    bathroomsHalf: integer('bathrooms_half'),
    stories: decimal('stories', { precision: 3, scale: 1 }),
    hasGarage: boolean('has_garage'),
    garageSpaces: integer('garage_spaces'),
    hasBasement: boolean('has_basement'),
    basementType: basementTypeEnum('basement_type'),
    basementFinished: boolean('basement_finished'),
    hasPool: boolean('has_pool'),
    poolType: poolTypeEnum('pool_type'),
    hasAc: boolean('has_ac'),
    hasFireplace: boolean('has_fireplace'),
    heatingType: varchar('heating_type', { length: 100 }),
    waterSupply: varchar('water_supply', { length: 50 }),
    sewage: varchar('sewage', { length: 50 }),
    descriptionText: text('description_text'),
    photoUrls: jsonb('photo_urls').$type<string[]>().default([]),
    photoCount: integer('photo_count').default(0),
    brokerName: varchar('broker_name', { length: 255 }),
    brokerAgency: varchar('broker_agency', { length: 255 }),
    rawData: jsonb('raw_data'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_listing_mls').on(table.mlsNumber),
    index('idx_listing_region_status').on(table.regionId, table.status),
    index('idx_listing_status').on(table.status),
    index('idx_listing_first_seen').on(table.firstSeenAt),
  ]
);
