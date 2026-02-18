/**
 * Proxy service for managing proxy connections and bandwidth tracking.
 * Tier 1: Basic proxy support with cost ceiling protection.
 * Tier 3: Database persistence for Railway restart resilience.
 */

import type { ProxyConfig } from '../../../config/scraper.config.js';
import { SCRAPER_CONFIG } from '../../../config/scraper.config.js';
import { db } from '../../../db/index.js';
import { proxyUsage as proxyUsageTable } from '../../../db/schema/proxy-usage.js';
import { eq } from 'drizzle-orm';

/**
 * Get or create proxy usage record from database
 */
async function getProxyUsage() {
  const existing = await db
    .select()
    .from(proxyUsageTable)
    .where(eq(proxyUsageTable.id, 'current'))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!;
  }

  // Create initial record
  const [newRecord] = await db
    .insert(proxyUsageTable)
    .values({
      id: 'current',
      monthlyUsageGB: 0,
      lastResetDate: new Date(),
    })
    .returning();

  return newRecord!;
}

/**
 * Get proxy configuration for Playwright browser context
 * Now async due to database budget check
 */
export async function getProxyConfiguration(proxyConfig: ProxyConfig): Promise<{
  server: string;
  username: string;
  password: string;
} | null> {
  if (!proxyConfig.enabled || proxyConfig.service === 'none') {
    return null;
  }

  // Check budget before allowing proxy usage
  if (SCRAPER_CONFIG.realtor.budget.enabled && (await isOverBudget())) {
    console.warn('[Proxy] Monthly bandwidth budget exceeded, proxy disabled');
    return null;
  }

  // Smartproxy and BrightData use similar format
  // Format: http://username:password@host:port
  return {
    server: `http://${proxyConfig.host}:${proxyConfig.port}`,
    username: proxyConfig.username,
    password: proxyConfig.password,
  };
}

/**
 * Check if we're over the monthly bandwidth budget
 * Now async with database persistence
 */
export async function isOverBudget(): Promise<boolean> {
  const config = SCRAPER_CONFIG.realtor.budget;

  if (!config.enabled) {
    return false;
  }

  // Check if we need to reset monthly counter
  await resetIfNewMonth();

  const usage = await getProxyUsage();
  const usagePercent = (usage.monthlyUsageGB / config.monthlyLimitGB) * 100;
  return usagePercent >= config.hardStopPercent;
}

/**
 * Check if we should alert about approaching budget limit
 * Now async with database persistence
 */
export async function shouldAlertBudget(): Promise<boolean> {
  const config = SCRAPER_CONFIG.realtor.budget;

  if (!config.enabled) {
    return false;
  }

  await resetIfNewMonth();

  const usage = await getProxyUsage();
  const usagePercent = (usage.monthlyUsageGB / config.monthlyLimitGB) * 100;
  return (
    usagePercent >= config.alertThresholdPercent &&
    usagePercent < config.hardStopPercent
  );
}

/**
 * Track bandwidth usage (estimate based on page loads)
 * This is approximate - actual proxy service will have precise numbers
 * Now async with database persistence
 */
export async function trackBandwidthUsage(estimatedKB: number): Promise<void> {
  if (!SCRAPER_CONFIG.realtor.budget.enabled) {
    return;
  }

  await resetIfNewMonth();

  const estimatedGB = estimatedKB / 1024 / 1024;
  const usage = await getProxyUsage();
  const newUsageGB = usage.monthlyUsageGB + estimatedGB;

  // Update database
  await db
    .update(proxyUsageTable)
    .set({
      monthlyUsageGB: newUsageGB,
      updatedAt: new Date(),
    })
    .where(eq(proxyUsageTable.id, 'current'));

  // Log if approaching limit
  if (await shouldAlertBudget()) {
    const config = SCRAPER_CONFIG.realtor.budget;
    const usagePercent = (newUsageGB / config.monthlyLimitGB) * 100;
    console.warn(
      `[Proxy] Bandwidth usage at ${usagePercent.toFixed(1)}% ` +
        `(${newUsageGB.toFixed(2)}GB / ${config.monthlyLimitGB}GB)`
    );
  }

  // Hard stop if over budget
  if (await isOverBudget()) {
    const config = SCRAPER_CONFIG.realtor.budget;
    console.error(
      `[Proxy] BUDGET EXCEEDED: ${newUsageGB.toFixed(2)}GB / ${config.monthlyLimitGB}GB - ` +
        `Proxy disabled until next month`
    );
  }
}

/**
 * Reset monthly usage counter if it's a new month
 * Now async with database persistence
 */
async function resetIfNewMonth(): Promise<void> {
  const now = new Date();
  const usage = await getProxyUsage();
  const lastReset = usage.lastResetDate;

  // Check if we're in a new month
  if (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    console.log(
      `[Proxy] New month detected, resetting bandwidth counter ` +
        `(was ${usage.monthlyUsageGB.toFixed(2)}GB)`
    );

    await db
      .update(proxyUsageTable)
      .set({
        monthlyUsageGB: 0,
        lastResetDate: now,
        updatedAt: now,
      })
      .where(eq(proxyUsageTable.id, 'current'));
  }
}

/**
 * Get current bandwidth usage stats
 * Now async with database persistence
 */
export async function getBandwidthStats(): Promise<{
  usageGB: number;
  limitGB: number;
  usagePercent: number;
  budgetEnabled: boolean;
}> {
  const config = SCRAPER_CONFIG.realtor.budget;
  await resetIfNewMonth();

  const usage = await getProxyUsage();

  return {
    usageGB: usage.monthlyUsageGB,
    limitGB: config.monthlyLimitGB,
    usagePercent: config.enabled
      ? (usage.monthlyUsageGB / config.monthlyLimitGB) * 100
      : 0,
    budgetEnabled: config.enabled,
  };
}

/**
 * Estimate bandwidth for a page load
 * These are rough estimates based on typical page sizes
 */
export const BANDWIDTH_ESTIMATES = {
  searchPage: 500, // KB
  detailPage: 1000, // KB (with images)
  warmupPage: 800, // KB
} as const;
