#!/usr/bin/env tsx
/**
 * Capture HTML from Centris.ca for selector development
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Centris.ca search URL - Montreal area, houses for sale, under $300k
const SEARCH_URL = 'https://www.centris.ca/en/properties~for-sale~montreal-region?view=Thumbnail';

async function captureHTML() {
  console.log('🚀 Launching browser...');

  const browser = await chromium.launch({
    headless: false, // Show browser
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

  console.log('🌐 Navigating to Centris.ca...');
  console.log('   URL:', SEARCH_URL);

  try {
    await page.goto(SEARCH_URL, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    console.log('⏳ Waiting for listings to load...');
    await page.waitForTimeout(5000);

    // Try to wait for listing elements
    console.log('⏳ Waiting for listing cards to render...');
    try {
      await page.waitForSelector('.property-thumbnail-item, [class*="property"], article', {
        timeout: 15000,
      });
      console.log('✓ Found listing elements');
    } catch {
      console.warn('⚠️  No listing elements detected yet');
    }

    // Try to detect if we're blocked
    const bodyText = await page.locator('body').textContent();
    if (bodyText?.includes('Access Denied') || bodyText?.includes('blocked')) {
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

    try {
      writeFileSync(
        join(fixturesDir, `centris-search-${timestamp}.html`),
        html,
        'utf-8'
      );
      console.log(`✅ Saved to: fixtures/centris-search-${timestamp}.html`);
    } catch (err) {
      // If fixtures dir doesn't exist, save to cwd
      const fallbackPath = join(process.cwd(), `centris-search-${timestamp}.html`);
      writeFileSync(fallbackPath, html, 'utf-8');
      console.log(`✅ Saved to: ${fallbackPath}`);
    }

    console.log('\n📊 Quick Analysis:');
    const selectors = [
      '.property-thumbnail-item',
      '[class*="property"]',
      'article',
      '[data-id]',
      '.thumbnail',
    ];

    for (const selector of selectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`   ${selector.padEnd(30)} → ${count} matches`);
        }
      } catch {
        // Invalid selector
      }
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Review the saved HTML file');
    console.log('   2. Inspect DOM structure');
    console.log('   3. Create centris-parser.service.ts with selectors');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

captureHTML();
