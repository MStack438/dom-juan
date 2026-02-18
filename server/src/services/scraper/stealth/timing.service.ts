/**
 * Timing and scheduling service for realistic request patterns.
 * Tier 3: Prevents detection through timing analysis and pattern recognition.
 */

import { SCRAPER_CONFIG } from '../../../config/scraper.config.js';

interface TimingConfig {
  minDelayMs: number;
  maxDelayMs: number;
  burstProtection: boolean; // Prevents rapid-fire requests
  timeOfDayAware: boolean; // Adjusts timing based on realistic usage hours
}

const DEFAULT_TIMING: TimingConfig = {
  minDelayMs: 2000,
  maxDelayMs: 6000,
  burstProtection: true,
  timeOfDayAware: true,
};

// Track last request time for burst protection
let lastRequestTime = 0;
const MIN_TIME_BETWEEN_REQUESTS = 1500; // Absolute minimum

/**
 * Get a randomized delay with realistic distribution
 * Uses weighted randomization to avoid uniform patterns
 */
export function getRandomDelay(config: Partial<TimingConfig> = {}): number {
  const { minDelayMs, maxDelayMs } = { ...DEFAULT_TIMING, ...config };

  // Use triangular distribution (weighted toward middle, not uniform)
  // This mimics human behavior better than uniform random
  const range = maxDelayMs - minDelayMs;
  const r1 = Math.random();
  const r2 = Math.random();
  const triangular = (r1 + r2) / 2; // Peaks at 0.5

  return Math.floor(minDelayMs + triangular * range);
}

/**
 * Get delay with time-of-day awareness
 * Humans browse slower at certain times (morning coffee, lunch, evening)
 */
export function getTimeAwareDelay(baseDelayMs: number): number {
  const hour = new Date().getHours();

  // Time-of-day multipliers (simulates realistic browsing patterns)
  let multiplier = 1.0;

  if (hour >= 0 && hour < 6) {
    // Late night/early morning: slower, more deliberate
    multiplier = 1.4;
  } else if (hour >= 6 && hour < 9) {
    // Morning: moderate speed
    multiplier = 1.1;
  } else if (hour >= 12 && hour < 14) {
    // Lunch: slower (distracted)
    multiplier = 1.3;
  } else if (hour >= 18 && hour < 22) {
    // Evening: peak browsing time, moderate speed
    multiplier = 1.0;
  } else if (hour >= 22 && hour < 24) {
    // Night: slower
    multiplier = 1.2;
  }

  // Add small random variance (±10%)
  multiplier *= Math.random() * 0.2 + 0.9;

  return Math.floor(baseDelayMs * multiplier);
}

/**
 * Wait with intelligent delay that considers burst protection and time-of-day
 */
export async function waitWithIntelligentDelay(
  config: Partial<TimingConfig> = {}
): Promise<void> {
  const fullConfig = { ...DEFAULT_TIMING, ...config };

  // Get base random delay
  let delayMs = getRandomDelay(fullConfig);

  // Apply time-of-day adjustment if enabled
  if (fullConfig.timeOfDayAware) {
    delayMs = getTimeAwareDelay(delayMs);
  }

  // Burst protection: ensure minimum time since last request
  if (fullConfig.burstProtection) {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;

    if (timeSinceLast < MIN_TIME_BETWEEN_REQUESTS) {
      const additionalDelay = MIN_TIME_BETWEEN_REQUESTS - timeSinceLast;
      delayMs += additionalDelay;
    }

    lastRequestTime = now + delayMs;
  }

  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Get delay between listing detail page views
 * Slightly longer than search page delays (humans take time to evaluate)
 */
export function getDetailPageDelay(): number {
  // Detail pages: 3-8 seconds (humans read more carefully)
  return getRandomDelay({
    minDelayMs: 3000,
    maxDelayMs: 8000,
    burstProtection: true,
    timeOfDayAware: true,
  });
}

/**
 * Get delay between search result pages
 * Shorter than detail pages (just scanning)
 */
export function getSearchPageDelay(): number {
  // Search pages: 2-5 seconds (quick scanning)
  return getRandomDelay({
    minDelayMs: 2000,
    maxDelayMs: 5000,
    burstProtection: true,
    timeOfDayAware: true,
  });
}

/**
 * Determine if current time is during "suspicious" hours
 * Bots often run during off-peak hours (2 AM - 5 AM)
 */
export function isDuringSuspiciousHours(): boolean {
  const hour = new Date().getHours();
  return hour >= 2 && hour < 5;
}

/**
 * Get recommended delay multiplier if during suspicious hours
 */
export function getSuspiciousHoursMultiplier(): number {
  if (isDuringSuspiciousHours()) {
    // Add 50-100% extra delay during suspicious hours
    return Math.random() * 0.5 + 1.5;
  }
  return 1.0;
}

/**
 * Calculate delay with jitter (randomized variance)
 * Prevents patterns in request timing
 */
export function addJitter(delayMs: number, jitterPercent: number = 0.2): number {
  const jitter = delayMs * jitterPercent;
  const variance = (Math.random() - 0.5) * 2 * jitter; // ±jitterPercent
  return Math.floor(delayMs + variance);
}

/**
 * Reset timing state (useful for testing or manual runs)
 */
export function resetTimingState(): void {
  lastRequestTime = 0;
}
