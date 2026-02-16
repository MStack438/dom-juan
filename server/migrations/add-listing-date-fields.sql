-- Add original listing date tracking fields
-- Migration: Add original_list_date and listed_days_when_found columns

-- Add original_list_date column (when the property was first listed on Realtor.ca)
ALTER TABLE listing
ADD COLUMN IF NOT EXISTS original_list_date TIMESTAMP WITH TIME ZONE;

-- Add listed_days_when_found column (how many days on market when we first scraped it)
ALTER TABLE listing
ADD COLUMN IF NOT EXISTS listed_days_when_found INTEGER;

-- Add index on original_list_date for sorting by actual listing age
CREATE INDEX IF NOT EXISTS idx_listing_original_list_date ON listing(original_list_date);

COMMENT ON COLUMN listing.original_list_date IS 'The date when the property was first listed on Realtor.ca (calculated from "X days on Realtor" when first scraped)';
COMMENT ON COLUMN listing.listed_days_when_found IS 'Number of days the listing had been on Realtor.ca when we first discovered it';
