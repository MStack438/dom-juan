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
  await page.goto('https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=300000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  // Test URL extraction from first card
  const urlTest = await page.evaluate(() => {
    const card = document.querySelector('div.listingCard');
    if (!card) return { found: false };

    const links = Array.from(card.querySelectorAll('a[href]'));
    const allHrefs = links.map(a => (a as HTMLAnchorElement).href);
    const relativeHrefs = links.map(a => a.getAttribute('href'));

    return {
      found: true,
      linkCount: links.length,
      absoluteHrefs: allHrefs.slice(0, 3),
      relativeHrefs: relativeHrefs.slice(0, 3),
    };
  });

  console.log('URL Extraction Test:', JSON.stringify(urlTest, null, 2));

  await browser.close();
}

main().catch(console.error);
