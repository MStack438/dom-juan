#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { buildSearchUrl } from '../src/services/scraper/url-builder.service.js';
import { parseSearchResults, parseDetailPage } from '../src/services/scraper/parser.service.js';

async function main() {
  console.log('🧪 Testing complete Realtor.ca scrape with stealth + date extraction...\n');

  // Build URL
  const searchUrl = buildSearchUrl({ priceMax: 300000 });
  console.log(`🔗 URL: ${searchUrl}\n`);

  // Launch with stealth
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-CA',
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'sec-ch-ua': '"Google Chrome";v="131"',
    },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    (window as any).chrome = { runtime: {} };
  });

  const page = await context.newPage();

  console.log('🌐 Loading search results...');
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  // Simulate human
  await page.mouse.move(250, 350);
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(1200);

  console.log('🔍 Parsing search results...\n');
  const results = await parseSearchResults(page);

  console.log(`Found ${results.length} listings`);

  if (results.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Testing detail page extraction...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const firstListing = results[0];
    const detailUrl = firstListing.detailUrl.startsWith('http') 
      ? firstListing.detailUrl 
      : `https://www.realtor.ca${firstListing.detailUrl}`;

    console.log(`📄 Loading: ${detailUrl}`);
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(8000);

    // Simulate human
    await page.mouse.move(300, 400);
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(2000);

    console.log('🔍 Extracting property details...\n');
    const details = await parseDetailPage(page);

    console.log('═══════════════════════════════════');
    console.log('EXTRACTED DATA:');
    console.log('═══════════════════════════════════');
    console.log(`MLS: ${firstListing.mlsNumber}`);
    console.log(`Price: $${firstListing.price.toLocaleString()}`);
    console.log(`Address: ${firstListing.address}`);
    console.log(`\nDays on Market: ${details.daysOnMarket !== undefined ? details.daysOnMarket : 'NOT FOUND'}`);
    console.log(`Original List Date: ${details.originalListDate ? details.originalListDate.toLocaleDateString() : 'NOT FOUND'}`);
    console.log(`\nProperty Type: ${details.propertyType || 'N/A'}`);
    console.log(`Bedrooms: ${details.bedrooms || 'N/A'}`);
    console.log(`Bathrooms: ${details.bathrooms || 'N/A'}`);

    if (details.daysOnMarket !== undefined) {
      console.log('\n✅ SUCCESS! "Time on REALTOR.ca" extracted and parsed correctly!');
    } else {
      console.log('\n❌ FAILED to extract "Time on REALTOR.ca" field');
    }
  } else {
    console.log('\n❌ No listings found - may be blocked');
  }

  await browser.close();
}

main().catch(console.error);
