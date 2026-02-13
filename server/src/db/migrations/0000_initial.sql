-- DOM Juan initial schema
-- Enums
CREATE TYPE property_type AS ENUM (
  'detached', 'semi_detached', 'townhouse', 'condo', 'duplex',
  'triplex', 'multi_family', 'land', 'farm', 'other'
);
CREATE TYPE listing_status AS ENUM ('active', 'delisted', 'sold', 'expired', 'unknown');
CREATE TYPE basement_type AS ENUM ('full', 'partial', 'crawl', 'none', 'unknown');
CREATE TYPE pool_type AS ENUM ('inground', 'above_ground', 'none', 'unknown');
CREATE TYPE scrape_run_status AS ENUM ('running', 'completed', 'partial', 'failed');
CREATE TYPE scrape_run_type AS ENUM ('scheduled', 'manual');

-- region
CREATE TABLE region (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES region(id) ON DELETE SET NULL,
  url_fragment VARCHAR(255),
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_region_parent ON region(parent_id);
CREATE INDEX idx_region_code ON region(code);

-- tracking_list
CREATE TABLE tracking_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  custom_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_tracking_list_active ON tracking_list(is_active);

-- listing
CREATE TABLE listing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mls_number VARCHAR(50) UNIQUE NOT NULL,
  source_url TEXT NOT NULL,
  region_id UUID REFERENCES region(id) ON DELETE SET NULL,
  address VARCHAR(500) NOT NULL,
  municipality VARCHAR(255),
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_detail_scrape_at TIMESTAMP WITH TIME ZONE,
  delisted_at TIMESTAMP WITH TIME ZONE,
  original_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  price_change_count INTEGER NOT NULL DEFAULT 0,
  status listing_status NOT NULL DEFAULT 'active',
  property_type property_type,
  year_built INTEGER,
  lot_size_sqft INTEGER,
  lot_dimensions VARCHAR(100),
  living_area_sqft INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  bathrooms_half INTEGER,
  stories DECIMAL(3, 1),
  has_garage BOOLEAN,
  garage_spaces INTEGER,
  has_basement BOOLEAN,
  basement_type basement_type,
  basement_finished BOOLEAN,
  has_pool BOOLEAN,
  pool_type pool_type,
  has_ac BOOLEAN,
  has_fireplace BOOLEAN,
  heating_type VARCHAR(100),
  water_supply VARCHAR(50),
  sewage VARCHAR(50),
  description_text TEXT,
  photo_urls JSONB DEFAULT '[]',
  photo_count INTEGER DEFAULT 0,
  broker_name VARCHAR(255),
  broker_agency VARCHAR(255),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX idx_listing_mls ON listing(mls_number);
CREATE INDEX idx_listing_region_status ON listing(region_id, status);
CREATE INDEX idx_listing_status ON listing(status);
CREATE INDEX idx_listing_first_seen ON listing(first_seen_at DESC);

-- listing_tracking_list
CREATE TABLE listing_tracking_list (
  listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
  tracking_list_id UUID NOT NULL REFERENCES tracking_list(id) ON DELETE CASCADE,
  first_matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (listing_id, tracking_list_id)
);
CREATE INDEX idx_ltl_tracking_list ON listing_tracking_list(tracking_list_id, is_active);
CREATE INDEX idx_ltl_listing ON listing_tracking_list(listing_id);

-- snapshot
CREATE TABLE snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  price INTEGER NOT NULL,
  status listing_status NOT NULL,
  photo_count INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_snapshot_listing_date ON snapshot(listing_id, captured_at DESC);
CREATE INDEX idx_snapshot_captured ON snapshot(captured_at DESC);

-- scrape_run
CREATE TABLE scrape_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type scrape_run_type NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status scrape_run_status NOT NULL DEFAULT 'running',
  tracking_lists_processed INTEGER DEFAULT 0,
  listings_found INTEGER DEFAULT 0,
  listings_new INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  listings_delisted INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_scrape_run_date ON scrape_run(started_at DESC);
CREATE INDEX idx_scrape_run_status ON scrape_run(status);
