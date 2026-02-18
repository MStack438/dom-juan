/**
 * Proxy usage tracking schema for persistent bandwidth monitoring.
 * Prevents usage tracking loss on server restarts.
 */

import { pgTable, varchar, timestamp, real } from 'drizzle-orm/pg-core';

export const proxyUsage = pgTable('proxy_usage', {
  id: varchar('id', { length: 50 }).primaryKey(), // 'current' for singleton pattern
  monthlyUsageGB: real('monthly_usage_gb').notNull().default(0),
  lastResetDate: timestamp('last_reset_date', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProxyUsage = typeof proxyUsage.$inferSelect;
export type NewProxyUsage = typeof proxyUsage.$inferInsert;
