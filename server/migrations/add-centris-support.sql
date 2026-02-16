-- Add Centris.ca support to database schema
-- Migration: Add source field and Centris number support

-- Add source column to listing table (realtor or centris)
ALTER TABLE listing
ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'realtor';

-- Add centris_number column for Centris listings
ALTER TABLE listing
ADD COLUMN IF NOT EXISTS centris_number VARCHAR(50);

-- Add source column to tracking_list table
ALTER TABLE tracking_list
ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'realtor';

-- Create index on source for faster queries
CREATE INDEX IF NOT EXISTS idx_listing_source ON listing(source);
CREATE INDEX IF NOT EXISTS idx_listing_centris_number ON listing(centris_number);
CREATE INDEX IF NOT EXISTS idx_tracking_list_source ON tracking_list(source);

-- Add unique constraint for centris_number (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_centris_number_unique
ON listing(centris_number) WHERE centris_number IS NOT NULL;

-- Update existing listings to have source = 'realtor'
UPDATE listing SET source = 'realtor' WHERE source IS NULL;
UPDATE tracking_list SET source = 'realtor' WHERE source IS NULL;

COMMENT ON COLUMN listing.source IS 'Data source: realtor or centris';
COMMENT ON COLUMN listing.centris_number IS 'Centris unique identifier (for Centris listings only)';
COMMENT ON COLUMN tracking_list.source IS 'Which site to scrape: realtor or centris';
