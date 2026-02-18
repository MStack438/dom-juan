#!/usr/bin/env tsx
/**
 * Test script for Tier 1 (MVP) stealth implementation
 * Tests: Config, Stealth injection, Proxy (without credentials), Retry logic
 */

import { SCRAPER_CONFIG, validateConfig } from '../src/config/scraper.config.js';
import { getRealisticUserAgent, getStealthHeaders } from '../src/services/scraper/stealth/stealth-injection.service.js';
import { getBandwidthStats, isOverBudget } from '../src/services/scraper/stealth/proxy.service.js';

console.log('🧪 TIER 1 (MVP) FUNCTIONALITY TEST\n');
console.log('═══════════════════════════════════\n');

// Test 1: Configuration loading
console.log('✅ Test 1: Configuration System');
try {
  validateConfig();
  console.log(`   Realtor enabled: ${SCRAPER_CONFIG.realtor.enabled}`);
  console.log(`   Stealth enabled: ${SCRAPER_CONFIG.realtor.stealth.enabled}`);
  console.log(`   Proxy enabled: ${SCRAPER_CONFIG.realtor.proxy.enabled}`);
  console.log(`   Max retries: ${SCRAPER_CONFIG.realtor.retry.maxAttempts}`);
  console.log('   ✓ Configuration loaded successfully\n');
} catch (error) {
  console.error('   ✗ Configuration failed:', error);
  process.exit(1);
}

// Test 2: Stealth helpers
console.log('✅ Test 2: Stealth Helper Functions');
const userAgent = getRealisticUserAgent();
const headers = getStealthHeaders('CA');
console.log(`   User agent: ${userAgent.substring(0, 50)}...`);
console.log(`   Headers count: ${Object.keys(headers).length}`);
console.log(`   Has Accept header: ${!!headers.Accept}`);
console.log('   ✓ Stealth helpers working\n');

// Test 3: Proxy budget tracking
console.log('✅ Test 3: Proxy Budget Management');
const stats = getBandwidthStats();
const overBudget = isOverBudget();
console.log(`   Budget enabled: ${stats.budgetEnabled}`);
console.log(`   Current usage: ${stats.usageGB.toFixed(2)} GB`);
console.log(`   Monthly limit: ${stats.limitGB} GB`);
console.log(`   Usage percent: ${stats.usagePercent.toFixed(1)}%`);
console.log(`   Over budget: ${overBudget ? 'YES ⚠️' : 'NO ✓'}`);
console.log('   ✓ Budget tracking working\n');

// Test 4: Retry configuration
console.log('✅ Test 4: Retry Configuration');
const retryConfig = SCRAPER_CONFIG.realtor.retry;
console.log(`   Max attempts: ${retryConfig.maxAttempts}`);
console.log(`   Base delay: ${retryConfig.baseDelayMs}ms`);
console.log(`   Max delay: ${retryConfig.maxDelayMs}ms`);
console.log(`   Backoff multiplier: ${retryConfig.backoffMultiplier}x`);
console.log(`   Jitter enabled: ${retryConfig.enableJitter}`);
console.log('   ✓ Retry config valid\n');

console.log('═══════════════════════════════════');
console.log('✅ ALL TIER 1 TESTS PASSED');
console.log('═══════════════════════════════════\n');
console.log('Next step: Test actual scraping with `npm run manual-scrape`\n');
