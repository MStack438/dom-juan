#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { SELECTORS } from '../src/services/scraper/parser.service.js';

async function main() {
  const url = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })).newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  const cards = await page.locator(SELECTORS.searchResults.listingCard).all();
  console.log(`Found ${cards.length} cards\n`);

  if (cards[0]) {
    console.log('=== CARD HTML ===');
    const html = await cards[0].innerHTML();
    console.log(html);
    
    console.log('\n\n=== ALL LINKS IN CARD ===');
    const links = await cards[0].locator('a').all();
    console.log(`Total <a> tags: ${links.length}`);
    
    for (let i = 0; i < links.length; i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      console.log(`\nLink ${i + 1}:`);
      console.log(`  href: ${href}`);
      console.log(`  text: ${text?.substring(0, 50)}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
