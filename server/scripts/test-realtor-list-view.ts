#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { parseSearchResults } from '../src/services/scraper/parser.service.js';

async function main() {
  // Use the new LIST VIEW format
  const url = 'https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=300000&TransactionTypeId=2&PropertyTypeGroupID=1&Sort=6-D';

  console.log('🧪 Testing Realtor.ca LIST VIEW with updated selectors...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  console.log('Loading Realtor.ca list view...');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Waiting for content to render...');
  await page.waitForTimeout(8000);

  console.log('\nParsing listings with updated selectors...\n');
  const results = await parseSearchResults(page);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total listings extracted: ${results.length}`);
  
  if (results.length > 0) {
    console.log('\n✅ SUCCESS! List view selectors are working!');
    console.log('\nFirst 3 listings:');
    results.slice(0, 3).forEach((r, i) => {
      console.log(`\n${i + 1}. MLS: ${r.mlsNumber}`);
      console.log(`   Price: $${r.price.toLocaleString()}`);
      console.log(`   Address: ${r.address}`);
      console.log(`   URL: ${r.detailUrl.substring(0, 80)}...`);
    });
  } else {
    console.log('\n❌ FAILED - No listings extracted');
  }

  await browser.close();
}

main().catch(console.error);
