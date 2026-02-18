-- Circuit breaker state table for Tier 2
-- Tracks service health and prevents wasting resources on failing services

CREATE TABLE IF NOT EXISTS "circuit_breaker_state" (
  "service" VARCHAR(50) PRIMARY KEY,
  "state" VARCHAR(20) NOT NULL DEFAULT 'closed',
  "opened_at" TIMESTAMP WITH TIME ZONE,
  "failure_count" INTEGER NOT NULL DEFAULT 0,
  "success_count" INTEGER NOT NULL DEFAULT 0,
  "last_failure_reason" TEXT,
  "last_checked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for querying by state
CREATE INDEX IF NOT EXISTS "idx_circuit_breaker_state" ON "circuit_breaker_state"("state");

-- Insert initial states for known services
INSERT INTO "circuit_breaker_state" ("service", "state", "failure_count", "success_count")
VALUES
  ('realtor', 'closed', 0, 0),
  ('centris', 'closed', 0, 0)
ON CONFLICT ("service") DO NOTHING;
