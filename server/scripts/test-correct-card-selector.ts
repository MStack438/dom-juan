#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  const listViewUrl = 'https://www.realtor.ca/qc/montreal/real-estate?PriceMax=300000&TransactionTypeId=2&PropertyTypeGroupID=1&Sort=6-D';
  
  console.log('🔍 Finding the correct card selector...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })).newPage();
  
  await page.goto(listViewUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  // Try different selectors
  const tests = [
    'div.listingCard',
    'li.cardCon',
    '.listingCard.card',
    'div[class*="listingCard"]',
  ];
  
  for (const selector of tests) {
    const count = await page.locator(selector).count();
    console.log(`${selector.padEnd(30)} → ${count} cards`);
  }
  
  // Use the best one
  const cards = await page.locator('div.listingCard').all();
  console.log(`\n✅ Using 'div.listingCard' - found ${cards.length} cards\n`);
  
  // Test extraction from first 3 cards
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const data = await cards[i].evaluate((el) => {
      const link = el.querySelector('a[href*="/real-estate/"]');
      const priceEl = el.querySelector('[class*="Price"]');
      const addressEl = el.querySelector('[class*="Address"]');
      const mlsEl = el.querySelector('[class*="MLS"]') || el.querySelector('[class*="mls"]');
      
      return {
        href: link?.getAttribute('href'),
        price: priceEl?.textContent?.trim(),
        address: addressEl?.textContent?.trim().substring(0, 80),
        mls: mlsEl?.textContent?.trim(),
      };
    });
    
    console.log(`Card ${i + 1}:`);
    console.log(`  MLS: ${data.mls || 'NOT FOUND'}`);
    console.log(`  Price: ${data.price}`);
    console.log(`  Address: ${data.address}`);
    console.log(`  URL: ${data.href}\n`);
  }
  
  await browser.close();
}

main().catch(console.error);
