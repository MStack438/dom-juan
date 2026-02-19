#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function testListViewURL() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  // Try the LIST VIEW URL instead of MAP VIEW
  const listUrl = 'https://www.realtor.ca/qc/greater-montreal/real-estate?TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  console.log('Testing LIST VIEW URL...\n');
  await page.goto(listUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await page.waitForTimeout(10000);

  // Test for listing cards
  const cardCount = await page.locator('div.listingCard').count();
  console.log(`div.listingCard: ${cardCount} cards found\n`);

  if (cardCount > 0) {
    console.log('✅ List view has listing cards!');

    // Test the fixed selector
    const firstCard = page.locator('div.listingCard').first();
    const detailLinkSelector = [
      'a[href*="/real-estate/"]',
      'a[href*="/property/"]',
      'a[href*="/listing/"]',
      'a[data-testid*="listing-link"]',
    ].join(', ');

    const link = firstCard.locator(detailLinkSelector).first();
    const href = await link.getAttribute('href').catch(() => null);

    if (href && href !== '#' && !href.startsWith('#')) {
      console.log(`✅ Parser would work! Detail link: ${href}`);
    } else {
      console.log(`⚠️  Parser would fail: href = ${href}`);
    }

    console.log('\n📝 Recommended URL for tracking list:');
    console.log(listUrl);
  } else {
    console.log('⚠️  List view also has no cards');
  }

  await browser.close();
}

testListViewURL().catch(console.error);
