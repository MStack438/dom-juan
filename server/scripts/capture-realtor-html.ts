#!/usr/bin/env tsx
/**
 * Helper script to capture Realtor.ca HTML for selector development.
 *
 * This script uses Playwright in non-headless mode with stealth techniques
 * to bypass Incapsula protection and save the actual HTML structure.
 *
 * Usage:
 *   npm run capture-html
 *
 * Or with custom URL:
 *   tsx scripts/capture-realtor-html.ts "https://www.realtor.ca/..."
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SEARCH_URL =
  process.argv[2] ||
  'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&LatitudeMax=45.70244&LongitudeMax=-73.06393&LatitudeMin=45.31398&LongitudeMin=-74.05941&Sort=6-D&PropertyTypeGroupID=1&PropertySearchTypeId=1&TransactionTypeId=2&PriceMax=300000&BuildingTypeId=1&BedRange=3-0&Currency=CAD';

async function captureHTML() {
  console.log('🚀 Launching browser...');

  const browser = await chromium.launch({
    headless: false, // Show browser to avoid detection
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
  });

  // Remove webdriver flag
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  const page = await context.newPage();

  console.log('🌐 Navigating to Realtor.ca...');
  console.log('   URL:', SEARCH_URL);

  try {
    await page.goto(SEARCH_URL, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    console.log('⏳ Waiting for listings to load...');

    // Wait for the React app to hydrate and load listings
    await page.waitForTimeout(5000);

    // Try to wait for actual listing content to appear
    console.log('⏳ Waiting for listing cards to render...');
    try {
      await page.waitForSelector('article, [role="article"], [class*="listing"], [class*="card"]', {
        timeout: 15000,
      });
      console.log('✓ Found listing elements');
    } catch {
      console.warn('⚠️  No listing elements detected yet, waiting longer...');
      await page.waitForTimeout(10000);
    }

    // Try to detect if we're blocked
    const bodyText = await page.locator('body').textContent();
    if (bodyText?.includes('Incapsula') || bodyText?.includes('Access Denied')) {
      console.error('❌ Bot protection detected!');
      console.log('\n⚠️  Manual steps required:');
      console.log('   1. The browser window should be open');
      console.log('   2. Complete any CAPTCHA or verification');
      console.log('   3. Wait for listings to fully load');
      console.log('   4. Press Enter in this terminal to continue...\n');

      // Wait for user to press Enter
      await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
      });
    }

    console.log('📸 Capturing HTML snapshot...');

    // Get the full HTML
    const html = await page.content();

    // Save to fixtures directory
    const fixturesDir = join(process.cwd(), 'src', 'services', 'scraper', 'fixtures');
    const timestamp = new Date().toISOString().split('T')[0];

    // Create fixtures directory if it doesn't exist
    try {
      writeFileSync(
        join(fixturesDir, `realtor-search-${timestamp}.html`),
        html,
        'utf-8'
      );
      console.log(`✅ Saved to: fixtures/realtor-search-${timestamp}.html`);
    } catch (err) {
      // If fixtures dir doesn't exist, save to cwd
      const fallbackPath = join(process.cwd(), `realtor-search-${timestamp}.html`);
      writeFileSync(fallbackPath, html, 'utf-8');
      console.log(`✅ Saved to: ${fallbackPath}`);
    }

    console.log('\n📊 Analysis:');
    const cardSelectors = [
      '[data-testid*="listing"]',
      '[class*="listingCard"]',
      '[class*="PropertyCard"]',
      'article',
      '[role="article"]',
      '.listing',
    ];

    for (const selector of cardSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`   ${selector} → ${count} matches`);
        }
      } catch (err) {
        // Selector might be invalid, skip
      }
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Open the saved HTML file');
    console.log('   2. Inspect the DOM structure');
    console.log('   3. Update SELECTORS in parser.service.ts');
    console.log('   4. Run tests: npm test parser.test.ts');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

captureHTML();
