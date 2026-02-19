#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function testMapWithStealth() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  const mapUrl = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  console.log('Testing MAP VIEW with stealth enabled...\n');
  await page.goto(mapUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for content to load
  await page.waitForTimeout(12000);

  // Test the combined selector
  const combinedSelector = [
    'div.listingCard',
    'li.cardCon',
    '[data-testid*="listing-card"]',
    '[data-testid*="listing"]',
    '[data-listing-id]',
    'article[class*="listing"]',
    'article[class*="card"]',
    '[class*="ListingCard"]',
    '[class*="PropertyCard"]',
    'article',
    '[role="article"]',
  ].join(', ');

  const allMatches = await page.locator(combinedSelector).all();
  console.log(`Combined selector found: ${allMatches.length} elements\n`);

  // Test each selector individually
  const individualSelectors = [
    'div.listingCard',
    'li.cardCon',
    '[data-testid*="listing-card"]',
    '[data-testid*="listing"]',
    '[data-listing-id]',
    'article[class*="listing"]',
    'article[class*="card"]',
    '[class*="ListingCard"]',
    '[class*="PropertyCard"]',
    'article',
    '[role="article"]',
  ];

  console.log('=== Individual Selector Results ===');
  for (const selector of individualSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✓ ${selector}: ${count} elements`);

      if (count <= 3) {
        // If only a few matches, show their content
        const elements = await page.locator(selector).all();
        for (let i = 0; i < elements.length; i++) {
          const html = await elements[i].innerHTML().catch(() => 'ERROR');
          console.log(`  Element ${i + 1} preview: ${html.substring(0, 150)}...`);
        }
      }
    }
  }

  // Check for the sidebar list
  console.log('\n=== Checking for sidebar/list panel ===');
  const sidebarSelectors = [
    '[class*="sidebar"]',
    '[class*="listing-panel"]',
    '[class*="results-panel"]',
    '[class*="list-panel"]',
    'aside',
  ];

  for (const sel of sidebarSelectors) {
    const count = await page.locator(sel).count();
    if (count > 0) {
      console.log(`${sel}: ${count} found`);
    }
  }

  await browser.close();
}

testMapWithStealth().catch(console.error);
