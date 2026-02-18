#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { buildSearchUrl } from '../src/services/scraper/url-builder.service.js';
import { parseSearchResults } from '../src/services/scraper/parser.service.js';
import { db } from '../src/db/index.js';
import { trackingList } from '../src/db/schema/tracking-list.js';
import { eq } from 'drizzle-orm';
import type { TrackingCriteria } from '../src/types/criteria.js';

async function main() {
  console.log('🧪 Testing Realtor.ca scraper with updated list view URL...\n');

  // Get the Realtor tracking list
  const lists = await db
    .select()
    .from(trackingList)
    .where(eq(trackingList.source, 'realtor'))
    .limit(1);

  if (lists.length === 0) {
    console.log('❌ No Realtor tracking lists found');
    return;
  }

  const list = lists[0];
  console.log(`📋 Tracking List: ${list.name}`);
  console.log(`   Criteria:`, JSON.stringify(list.criteria, null, 2));

  // Build the URL using our updated builder
  const searchUrl = buildSearchUrl((list.criteria ?? {}) as TrackingCriteria);
  console.log(`\n🔗 Built URL: ${searchUrl}\n`);

  // Launch browser and scrape
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  console.log('🌐 Loading page...');
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  console.log('⏳ Waiting for content to render...');
  await page.waitForTimeout(8000);

  console.log('🔍 Parsing listings...\n');
  const results = await parseSearchResults(page);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SCRAPE TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total listings found: ${results.length}`);

  if (results.length > 0) {
    // Check for uniqueness
    const uniqueMls = new Set(results.map(r => r.mlsNumber));
    const uniquePrices = new Set(results.map(r => r.price));
    
    console.log(`Unique MLS numbers: ${uniqueMls.size}`);
    console.log(`Unique prices: ${uniquePrices.size}`);
    
    if (uniqueMls.size < results.length) {
      console.log('\n⚠️  WARNING: Duplicate MLS numbers detected!');
    }
    
    console.log('\n✅ First 5 listings:');
    results.slice(0, 5).forEach((r, i) => {
      console.log(`\n${i + 1}. MLS: ${r.mlsNumber}`);
      console.log(`   Price: $${r.price.toLocaleString()}`);
      console.log(`   Address: ${r.address.trim().substring(0, 80)}`);
      console.log(`   URL: ${r.detailUrl.substring(0, 100)}`);
    });
  } else {
    console.log('\n❌ FAILED - No listings extracted');
    
    // Check for bot detection
    const bodyText = await page.evaluate(() => document.body.textContent || '');
    if (bodyText.toLowerCase().includes('incapsula') || 
        bodyText.toLowerCase().includes('access denied') ||
        bodyText.toLowerCase().includes('blocked')) {
      console.log('⚠️  Bot protection may be blocking access');
    }
  }

  await browser.close();
  process.exit(0);
}

main().catch(console.error);
