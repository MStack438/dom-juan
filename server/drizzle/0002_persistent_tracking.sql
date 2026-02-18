-- Persistent tracking for fingerprint usage and proxy bandwidth
-- Prevents state loss on Railway container restarts

-- Fingerprint usage tracking table
CREATE TABLE IF NOT EXISTS "fingerprint_usage" (
  "fingerprint_id" VARCHAR(50) PRIMARY KEY,
  "last_used_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "use_count" INTEGER NOT NULL DEFAULT 0,
  "success_count" INTEGER NOT NULL DEFAULT 0,
  "failure_count" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for finding least recently used fingerprints
CREATE INDEX IF NOT EXISTS "idx_fingerprint_last_used" ON "fingerprint_usage"("last_used_at");

-- Proxy usage tracking table (singleton pattern)
CREATE TABLE IF NOT EXISTS "proxy_usage" (
  "id" VARCHAR(50) PRIMARY KEY,
  "monthly_usage_gb" REAL NOT NULL DEFAULT 0,
  "last_reset_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Initialize singleton row for current usage tracking
INSERT INTO "proxy_usage" ("id", "monthly_usage_gb", "last_reset_date")
VALUES ('current', 0, NOW())
ON CONFLICT ("id") DO NOTHING;
