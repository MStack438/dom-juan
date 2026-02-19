#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function testMapView() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  const mapUrl = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  console.log('Testing MAP VIEW URL...\n');
  await page.goto(mapUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Try different wait times
  for (const waitTime of [5000, 10000, 15000]) {
    await page.waitForTimeout(waitTime);

    const cardSelectors = [
      'div.listingCard',
      'li.cardCon',
      '[data-testid*="listing-card"]',
    ];

    console.log(`\n=== After ${waitTime}ms wait ===`);
    for (const selector of cardSelectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} cards`);

      if (count > 0) {
        const firstCard = page.locator(selector).first();

        // Test the fixed selector
        const detailLinkSelector = [
          'a[href*="/real-estate/"]',
          'a[href*="/property/"]',
          'a[href*="/listing/"]',
          'a[data-testid*="listing-link"]',
        ].join(', ');

        const link = firstCard.locator(detailLinkSelector).first();
        const href = await link.getAttribute('href').catch(() => null);
        console.log(`  First card detail link: ${href}`);

        if (href && href !== '#' && !href.startsWith('#')) {
          console.log(`  ✅ Valid link found!`);
        } else {
          console.log(`  ⚠️  Link is fragment or null`);

          // Try all links
          const allLinks = await firstCard.locator('a[href]').all();
          console.log(`  Total links in card: ${allLinks.length}`);
          for (let i = 0; i < allLinks.length; i++) {
            const h = await allLinks[i].getAttribute('href');
            console.log(`    Link ${i + 1}: ${h}`);
          }
        }
      }
    }
  }

  await browser.close();
}

testMapView().catch(console.error);
