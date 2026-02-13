import { pgEnum } from 'drizzle-orm/pg-core';

export const propertyTypeEnum = pgEnum('property_type', [
  'detached',
  'semi_detached',
  'townhouse',
  'condo',
  'duplex',
  'triplex',
  'multi_family',
  'land',
  'farm',
  'other',
]);

export const listingStatusEnum = pgEnum('listing_status', [
  'active',
  'delisted',
  'sold',
  'expired',
  'unknown',
]);

export const basementTypeEnum = pgEnum('basement_type', [
  'full',
  'partial',
  'crawl',
  'none',
  'unknown',
]);

export const poolTypeEnum = pgEnum('pool_type', [
  'inground',
  'above_ground',
  'none',
  'unknown',
]);

export const scrapeRunStatusEnum = pgEnum('scrape_run_status', [
  'running',
  'completed',
  'partial',
  'failed',
]);

export const scrapeRunTypeEnum = pgEnum('scrape_run_type', [
  'scheduled',
  'manual',
]);
