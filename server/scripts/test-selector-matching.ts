#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
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
  await page.goto('https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=300000', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(8000);

  // Find cards
  const cards = page.locator('div.listingCard');
  const cardCount = await cards.count();
  console.log(`Found ${cardCount} cards`);

  if (cardCount > 0) {
    const firstCard = cards.first();

    // Test the exact selector from parser
    const detailLinkSelector = [
      'a[href*="/real-estate/"]',
      'a[href*="/property/"]',
      'a[href*="/listing/"]',
      'a[data-testid*="listing-link"]',
      'a[class*="listing"]',
    ].join(', ');

    console.log('\n=== Testing Selector ===');
    console.log('Selector:', detailLinkSelector);

    const specificLink = firstCard.locator(detailLinkSelector).first();
    const href1 = await specificLink.getAttribute('href').catch(() => null);
    console.log('Result from .first():', href1);

    // Test each selector individually
    console.log('\n=== Individual Selector Tests ===');
    const selectors = [
      'a[href*="/real-estate/"]',
      'a[href*="/property/"]',
      'a[href*="/listing/"]',
      'a[data-testid*="listing-link"]',
      'a[class*="listing"]',
    ];

    for (const sel of selectors) {
      const count = await firstCard.locator(sel).count();
      if (count > 0) {
        const href = await firstCard.locator(sel).first().getAttribute('href');
        console.log(`${sel}: ${count} matches, first href: ${href}`);
      } else {
        console.log(`${sel}: 0 matches`);
      }
    }

    // Test Strategy 2 from parser
    console.log('\n=== Strategy 2: All Links ===');
    const anyLinks = await firstCard.locator('a[href]').all();
    console.log(`Found ${anyLinks.length} links total`);

    for (let i = 0; i < anyLinks.length; i++) {
      const linkHref = await anyLinks[i].getAttribute('href');
      const matches = linkHref && (
        linkHref.includes('/real-estate/') ||
        linkHref.includes('/property') ||
        linkHref.includes('/listing') ||
        linkHref.includes('MLS') ||
        linkHref.includes('/map#') ||
        /\d{6,}/.test(linkHref)
      );
      console.log(`  Link ${i + 1}: ${linkHref} (matches: ${matches})`);
    }
  }

  await browser.close();
}

main().catch(console.error);
