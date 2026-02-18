#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { parseSearchResults } from '../src/services/scraper/parser.service.js';

async function main() {
  const url = 'https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=300000&TransactionTypeId=2&PropertyTypeGroupID=1&Sort=6-D';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  const results = await parseSearchResults(page);
  
  console.log(`Found ${results.length} listings\n`);
  
  // Show all unique MLS numbers
  const uniqueMls = new Set(results.map(r => r.mlsNumber));
  console.log(`Unique MLS numbers: ${uniqueMls.size}`);
  
  // Show first 5 with full details
  console.log('\nFirst 5 listings (full details):\n');
  results.slice(0, 5).forEach((r, i) => {
    console.log(`${i + 1}. MLS: ${r.mlsNumber}`);
    console.log(`   Price: $${r.price}`);
    console.log(`   Address: ${r.address.trim()}`);
    console.log(`   URL: ${r.detailUrl}\n`);
  });

  await browser.close();
}

main().catch(console.error);
