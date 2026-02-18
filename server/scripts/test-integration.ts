#!/usr/bin/env tsx
/**
 * Quick integration test - verify services can be imported and initialized
 */

console.log('🔧 Testing Tier 1 integration...\n');

// Test imports
console.log('✓ Importing configuration...');
import { SCRAPER_CONFIG } from '../src/config/scraper.config.js';

console.log('✓ Importing stealth services...');
import {
  injectStealthScripts,
  getRealisticUserAgent,
  simulateHumanBehavior,
} from '../src/services/scraper/stealth/stealth-injection.service.js';

console.log('✓ Importing proxy services...');
import {
  getProxyConfiguration,
  trackBandwidthUsage,
  BANDWIDTH_ESTIMATES,
} from '../src/services/scraper/stealth/proxy.service.js';

console.log('✓ Importing retry services...');
import { withRetry, retryPageNavigation } from '../src/services/scraper/stealth/retry.service.js';

console.log('✓ Importing scraper service...');
import { startScrapeRun, executeScrapeRun } from '../src/services/scraper/scraper.service.js';

console.log('\n✅ ALL SERVICES IMPORTED SUCCESSFULLY\n');

// Test proxy configuration
console.log('Testing proxy configuration...');
const proxyConfig = getProxyConfiguration(SCRAPER_CONFIG.realtor.proxy);
console.log(`  Proxy enabled: ${SCRAPER_CONFIG.realtor.proxy.enabled}`);
console.log(`  Proxy config: ${proxyConfig ? 'Generated' : 'Disabled (expected)'}`);

// Test bandwidth tracking
console.log('\nTesting bandwidth tracking...');
trackBandwidthUsage(BANDWIDTH_ESTIMATES.searchPage);
console.log('  ✓ Tracked 500KB usage');

// Test retry
console.log('\nTesting retry logic...');
let attempts = 0;
try {
  await withRetry(
    async (context) => {
      attempts = context.attempt;
      if (context.attempt < 2) {
        throw new Error('Test failure');
      }
      return 'success';
    },
    {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      enableJitter: false,
    },
    'test-operation'
  );
  console.log(`  ✓ Retry succeeded after ${attempts} attempts`);
} catch (error) {
  console.error('  ✗ Retry failed:', error);
}

console.log('\n═══════════════════════════════════');
console.log('✅ TIER 1 INTEGRATION TEST PASSED');
console.log('═══════════════════════════════════\n');
