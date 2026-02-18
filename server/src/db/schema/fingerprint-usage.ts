/**
 * Fingerprint usage tracking schema for persistent rotation state.
 * Prevents fingerprint state loss on server restarts.
 */

import { pgTable, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const fingerprintUsage = pgTable('fingerprint_usage', {
  fingerprintId: varchar('fingerprint_id', { length: 50 }).primaryKey(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  useCount: integer('use_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type FingerprintUsage = typeof fingerprintUsage.$inferSelect;
export type NewFingerprintUsage = typeof fingerprintUsage.$inferInsert;
