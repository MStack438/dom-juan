/**
 * Circuit breaker state schema for persistent failure tracking.
 * Prevents wasting resources when a service is consistently failing.
 */

import { pgTable, varchar, timestamp, integer, text } from 'drizzle-orm/pg-core';

export const circuitBreakerState = pgTable('circuit_breaker_state', {
  service: varchar('service', { length: 50 }).primaryKey(), // 'realtor' or 'centris'
  state: varchar('state', { length: 20 }).notNull().default('closed'), // 'closed', 'open', 'half_open'
  openedAt: timestamp('opened_at', { withTimezone: true }),
  failureCount: integer('failure_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  lastFailureReason: text('last_failure_reason'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CircuitBreakerState = typeof circuitBreakerState.$inferSelect;
export type NewCircuitBreakerState = typeof circuitBreakerState.$inferInsert;
