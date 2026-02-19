#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function testParserFix() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  await page.goto('https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=300000', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(8000);

  const cards = page.locator('div.listingCard');
  const cardCount = await cards.count();
  console.log(`Found ${cardCount} cards\n`);

  if (cardCount > 0) {
    const firstCard = cards.first();

    // Test the FIXED selector (removed a[class*="listing"])
    const FIXED_SELECTOR = [
      'a[href*="/real-estate/"]',
      'a[href*="/property/"]',
      'a[href*="/listing/"]',
      'a[data-testid*="listing-link"]',
    ].join(', ');

    console.log('=== Testing FIXED Selector (Strategy 1) ===');
    const specificLink = firstCard.locator(FIXED_SELECTOR).first();
    const rawHref = await specificLink.getAttribute('href').catch(() => null);
    console.log('Raw href from .first():', rawHref);

    // Apply validation (reject # fragments)
    let validHref = null;
    if (rawHref && rawHref !== '#' && !rawHref.startsWith('#')) {
      validHref = rawHref;
    }
    console.log('After validation:', validHref);

    if (validHref) {
      console.log('\n✅ SUCCESS: Parser would extract:', validHref);
    } else {
      console.log('\n⚠️  Strategy 1 failed, would fallback to Strategy 2');

      // Test Strategy 2
      const anyLinks = await firstCard.locator('a[href]').all();
      for (const link of anyLinks) {
        const linkHref = await link.getAttribute('href');
        if (linkHref && (
          linkHref.includes('/real-estate/') ||
          linkHref.includes('/property') ||
          linkHref.includes('/listing')
        )) {
          console.log('✅ Strategy 2 SUCCESS:', linkHref);
          break;
        }
      }
    }
  }

  await browser.close();
}

testParserFix().catch(console.error);
