/**
 * Fingerprint rotation service for advanced bot evasion.
 * Tier 2: Generates varied browser fingerprints to avoid detection patterns.
 * Tier 3: Database persistence for Railway restart resilience.
 */

import { SCRAPER_CONFIG } from '../../../config/scraper.config.js';
import { db } from '../../../db/index.js';
import { fingerprintUsage } from '../../../db/schema/fingerprint-usage.js';
import { eq, asc } from 'drizzle-orm';

export interface BrowserFingerprint {
  id: string;
  userAgent: string;
  viewport: { width: number; height: number };
  platform: 'MacIntel' | 'Win32' | 'Linux x86_64';
  vendor: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  screenDepth: 24 | 30;
  language: string;
  languages: string[];
  timezone: string;
}

// Pre-generated fingerprint library
// Each fingerprint represents a realistic browser configuration
const FINGERPRINT_LIBRARY: BrowserFingerprint[] = [
  {
    id: 'mac_chrome_131_16gb',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    platform: 'MacIntel',
    vendor: 'Google Inc.',
    hardwareConcurrency: 8,
    deviceMemory: 16,
    screenDepth: 30,
    language: 'en-CA',
    languages: ['en-CA', 'en-US', 'en', 'fr'],
    timezone: 'America/Montreal',
  },
  {
    id: 'mac_chrome_130_8gb',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    viewport: { width: 1680, height: 1050 },
    platform: 'MacIntel',
    vendor: 'Google Inc.',
    hardwareConcurrency: 4,
    deviceMemory: 8,
    screenDepth: 24,
    language: 'en-CA',
    languages: ['en-CA', 'en-US', 'en'],
    timezone: 'America/Toronto',
  },
  {
    id: 'mac_safari_17_16gb',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    viewport: { width: 1440, height: 900 },
    platform: 'MacIntel',
    vendor: 'Apple Computer, Inc.',
    hardwareConcurrency: 8,
    deviceMemory: 16,
    screenDepth: 24,
    language: 'en-CA',
    languages: ['en-CA', 'en'],
    timezone: 'America/Montreal',
  },
  {
    id: 'win_chrome_131_16gb',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    platform: 'Win32',
    vendor: 'Google Inc.',
    hardwareConcurrency: 12,
    deviceMemory: 16,
    screenDepth: 24,
    language: 'en-US',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
  },
  {
    id: 'win_chrome_130_8gb',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    platform: 'Win32',
    vendor: 'Google Inc.',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    screenDepth: 24,
    language: 'en-US',
    languages: ['en-US', 'en'],
    timezone: 'America/Chicago',
  },
  {
    id: 'mac_chrome_131_8gb_2k',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 2560, height: 1440 },
    platform: 'MacIntel',
    vendor: 'Google Inc.',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    screenDepth: 30,
    language: 'en-CA',
    languages: ['en-CA', 'en-US', 'en'],
    timezone: 'America/Montreal',
  },
];

/**
 * Get a fingerprint based on rotation strategy
 * Now async to support database persistence
 */
export async function getFingerprint(): Promise<BrowserFingerprint> {
  const strategy = SCRAPER_CONFIG.realtor.stealth.fingerprintRotation;

  switch (strategy) {
    case 'aggressive':
      // New fingerprint every time
      return getRandomFingerprint();

    case 'moderate':
      // Rotate after 5 uses or 1 hour
      return await getLeastRecentlyUsed(5, 60 * 60 * 1000);

    case 'conservative':
      // Rotate after 20 uses or 24 hours
      return await getLeastRecentlyUsed(20, 24 * 60 * 60 * 1000);

    case 'off':
    default:
      // Always use first fingerprint (consistent)
      return FINGERPRINT_LIBRARY[0]!;
  }
}

/**
 * Get a random fingerprint from the library
 */
function getRandomFingerprint(): BrowserFingerprint {
  const index = Math.floor(Math.random() * FINGERPRINT_LIBRARY.length);
  return FINGERPRINT_LIBRARY[index]!;
}

/**
 * Get least recently used fingerprint that hasn't exceeded limits
 * Uses database for persistent tracking across restarts
 */
async function getLeastRecentlyUsed(maxUses: number, maxAgeMs: number): Promise<BrowserFingerprint> {
  const now = new Date();

  // Get all usage records from database
  const usageRecords = await db.select().from(fingerprintUsage);
  const usageMap = new Map(usageRecords.map((u) => [u.fingerprintId, u]));

  // Find fingerprints that can be used
  const available = FINGERPRINT_LIBRARY.filter((fp) => {
    const usage = usageMap.get(fp.id);
    if (!usage) return true; // Never used

    // Check use count
    if (usage.useCount >= maxUses) {
      // Reset if enough time has passed
      const ageMs = now.getTime() - usage.lastUsedAt.getTime();
      if (ageMs < maxAgeMs) {
        return false; // Too many recent uses
      }
    }

    return true;
  });

  if (available.length === 0) {
    // All fingerprints exhausted, reset tracking
    console.warn('[Fingerprint] All fingerprints exhausted, resetting usage tracking');
    await db.delete(fingerprintUsage); // Clear all usage records
    return FINGERPRINT_LIBRARY[0]!;
  }

  // Sort by least recently used
  available.sort((a, b) => {
    const usageA = usageMap.get(a.id);
    const usageB = usageMap.get(b.id);

    if (!usageA && !usageB) return 0;
    if (!usageA) return -1; // Never used goes first
    if (!usageB) return 1;

    return usageA.lastUsedAt.getTime() - usageB.lastUsedAt.getTime();
  });

  return available[0]!;
}

/**
 * Mark a fingerprint as used
 * Now async with database persistence
 */
export async function markFingerprintUsed(fingerprintId: string, success: boolean): Promise<void> {
  const existing = await db
    .select()
    .from(fingerprintUsage)
    .where(eq(fingerprintUsage.fingerprintId, fingerprintId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    const current = existing[0]!;
    await db
      .update(fingerprintUsage)
      .set({
        lastUsedAt: new Date(),
        useCount: current.useCount + 1,
        successCount: success ? current.successCount + 1 : current.successCount,
        failureCount: success ? current.failureCount : current.failureCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(fingerprintUsage.fingerprintId, fingerprintId));

    // Log if fingerprint is performing poorly
    const newUseCount = current.useCount + 1;
    const newSuccessCount = success ? current.successCount + 1 : current.successCount;
    if (newUseCount >= 5) {
      const successRate = newSuccessCount / newUseCount;
      if (successRate < 0.5) {
        console.warn(
          `[Fingerprint] ${fingerprintId} has low success rate: ${(successRate * 100).toFixed(1)}% ` +
          `(${newSuccessCount}/${newUseCount})`
        );
      }
    }
  } else {
    // Create new record
    await db.insert(fingerprintUsage).values({
      fingerprintId,
      lastUsedAt: new Date(),
      useCount: 1,
      successCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
      updatedAt: new Date(),
    });
  }
}

/**
 * Get fingerprint statistics for monitoring
 * Now async with database persistence
 */
export async function getFingerprintStats(): Promise<{
  totalFingerprints: number;
  usedFingerprints: number;
  stats: Array<{
    id: string;
    uses: number;
    successRate: number;
    lastUsed: Date | null;
  }>;
}> {
  const usageRecords = await db.select().from(fingerprintUsage);

  const stats = usageRecords.map((usage) => ({
    id: usage.fingerprintId,
    uses: usage.useCount,
    successRate: usage.useCount > 0 ? usage.successCount / usage.useCount : 0,
    lastUsed: usage.lastUsedAt,
  }));

  return {
    totalFingerprints: FINGERPRINT_LIBRARY.length,
    usedFingerprints: usageRecords.length,
    stats,
  };
}

/**
 * Apply fingerprint to browser context options
 */
export function applyFingerprintToContext(fingerprint: BrowserFingerprint): {
  userAgent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezoneId: string;
} {
  return {
    userAgent: fingerprint.userAgent,
    viewport: fingerprint.viewport,
    locale: fingerprint.language,
    timezoneId: fingerprint.timezone,
  };
}

/**
 * Get enhanced stealth script that uses fingerprint details
 */
export function getFingerprintedStealthScript(fingerprint: BrowserFingerprint): string {
  return `
    // Apply fingerprint-specific values
    Object.defineProperty(navigator, 'platform', {
      get: () => '${fingerprint.platform}',
    });

    Object.defineProperty(navigator, 'vendor', {
      get: () => '${fingerprint.vendor}',
    });

    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => ${fingerprint.hardwareConcurrency},
    });

    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => ${fingerprint.deviceMemory},
    });

    Object.defineProperty(navigator, 'languages', {
      get: () => ${JSON.stringify(fingerprint.languages)},
    });

    Object.defineProperty(navigator, 'language', {
      get: () => '${fingerprint.language}',
    });

    // Screen properties
    Object.defineProperty(screen, 'colorDepth', {
      get: () => ${fingerprint.screenDepth},
    });

    Object.defineProperty(screen, 'pixelDepth', {
      get: () => ${fingerprint.screenDepth},
    });
  `;
}
