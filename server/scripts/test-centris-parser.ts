#!/usr/bin/env tsx
/**
 * Test the Centris parser against captured HTML
 */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { parseCentrisSearchResults } from '../src/services/scraper/centris-parser.service.js';

async function test() {
  console.log('🧪 Testing Centris Parser\n');

  const htmlPath = 'src/services/scraper/fixtures/centris-with-listings.html';
  console.log(`📄 Loading: ${htmlPath}`);

  const html = readFileSync(htmlPath, 'utf-8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html);

  console.log('\n🔍 Parsing listings...\n');

  const results = await parseCentrisSearchResults(page);

  console.log(`\n📊 Results Summary:`);
  console.log(`   Total listings: ${results.length}`);

  if (results.length > 0) {
    console.log(`\n🏠 Sample Listings:\n`);

    results.slice(0, 5).forEach((listing, i) => {
      console.log(`${i + 1}. Centris #${listing.centrisNumber}`);
      console.log(`   Price: $${listing.price.toLocaleString()}`);
      console.log(`   Address: ${listing.address}`);
      console.log(`   Category: ${listing.category || 'N/A'}`);
      console.log(`   Bedrooms: ${listing.bedrooms || 'N/A'}`);
      console.log(`   Bathrooms: ${listing.bathrooms || 'N/A'}`);
      console.log(`   Photos: ${listing.photoCount || 'N/A'}`);
      console.log(`   URL: ${listing.detailUrl}`);
      console.log('');
    });

    if (results.length > 5) {
      console.log(`   ... and ${results.length - 5} more listings\n`);
    }

    // Validation
    const hasAllPrices = results.every(r => r.price > 0);
    const hasAllCentrisNumbers = results.every(r => r.centrisNumber.length > 0);
    const hasAllUrls = results.every(r => r.detailUrl.startsWith('http'));

    console.log('✅ Validation:');
    console.log(`   ${hasAllPrices ? '✓' : '✗'} All listings have prices`);
    console.log(`   ${hasAllCentrisNumbers ? '✓' : '✗'} All listings have Centris numbers`);
    console.log(`   ${hasAllUrls ? '✓' : '✗'} All listings have valid URLs`);

    if (hasAllPrices && hasAllCentrisNumbers && hasAllUrls) {
      console.log('\n🎉 Parser working correctly!');
    } else {
      console.log('\n⚠️  Some data missing, check selectors');
    }
  } else {
    console.log('\n❌ No listings found - selectors may be incorrect');
  }

  await browser.close();
  process.exit(0);
}

test();
