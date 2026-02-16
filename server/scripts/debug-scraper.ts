#!/usr/bin/env tsx
/**
 * Debug script to see what the scraper is actually capturing
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

async function debugScraper() {
  console.log('🔍 Launching browser...');

  const browser = await chromium.launch({ headless: false }); // non-headless to see what happens
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  console.log('🌐 Navigating to Realtor.ca...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

  console.log('⏳ Waiting 10 seconds for React to hydrate...');
  await page.waitForTimeout(10000);

  console.log('📸 Capturing HTML...');
  const html = await page.content();
  writeFileSync('debug-scraper-output.html', html);
  console.log('✅ Saved to: debug-scraper-output.html');

  // Test selectors
  console.log('\n🔍 Testing selectors:');

  const selectors = [
    'article',
    '[role="article"]',
    '[data-testid*="listing"]',
    '[class*="listing"]',
    '[class*="card"]',
    '[class*="Card"]',
  ];

  for (const selector of selectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✓ ${selector.padEnd(35)} → ${count} matches`);
      }
    } catch {
      // Invalid selector
    }
  }

  // Check if bot protection
  const bodyText = await page.locator('body').textContent();
  if (bodyText?.includes('Incapsula') || bodyText?.includes('Access Denied')) {
    console.log('\n❌ Bot protection detected!');
  }

  console.log('\n💡 Browser window will stay open. Check what you see.');
  console.log('   Press Ctrl+C when done.');

  // Keep browser open
  await new Promise(() => {});
}

debugScraper();
