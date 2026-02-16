#!/usr/bin/env tsx
/**
 * Quick health check for parser selectors.
 *
 * Tests current selectors against the most recent HTML fixture.
 *
 * Usage:
 *   npm run check-selectors
 *   tsx scripts/check-selectors.ts path/to/fixture.html
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { chromium } from 'playwright';
import { SELECTORS } from '../src/services/scraper/parser.service.js';

// Find the most recent fixture file
function findLatestFixture(): string | null {
  const fixturesDir = join(process.cwd(), 'src', 'services', 'scraper', 'fixtures');

  try {
    const files = readdirSync(fixturesDir)
      .filter((f) => f.endsWith('.html') && f.includes('realtor'))
      .sort()
      .reverse();

    return files.length > 0 ? join(fixturesDir, files[0]) : null;
  } catch {
    return null;
  }
}

async function checkSelectors() {
  console.log('🔍 Selector Health Check\n');

  const htmlPath = process.argv[2] || findLatestFixture();

  if (!htmlPath) {
    console.error('❌ No HTML fixture found.');
    console.error('');
    console.error('To fix:');
    console.error('  1. Run: npm run capture-html');
    console.error('  2. Or specify path: tsx scripts/check-selectors.ts path/to/file.html');
    console.error('');
    process.exit(1);
  }

  console.log(`📄 Testing against: ${htmlPath}\n`);

  const html = readFileSync(htmlPath, 'utf-8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Search Results Selectors');
  console.log('═══════════════════════════════════════════════════════\n');

  const searchSelectors = [
    { name: 'Listing Cards', selector: SELECTORS.searchResults.listingCard, critical: true },
    { name: 'Price', selector: SELECTORS.searchResults.price, critical: true },
    { name: 'Address', selector: SELECTORS.searchResults.address, critical: true },
    { name: 'Detail Link', selector: SELECTORS.searchResults.detailLink, critical: true },
    { name: 'MLS Number', selector: SELECTORS.searchResults.mlsNumber, critical: true },
    { name: 'Bedrooms', selector: SELECTORS.searchResults.beds, critical: false },
    { name: 'Bathrooms', selector: SELECTORS.searchResults.baths, critical: false },
    { name: 'Sqft', selector: SELECTORS.searchResults.sqft, critical: false },
    { name: 'Photo', selector: SELECTORS.searchResults.photo, critical: false },
  ];

  let criticalFailures = 0;

  for (const { name, selector, critical } of searchSelectors) {
    try {
      const count = await page.locator(selector).count();
      const status = count > 0 ? '✅' : (critical ? '❌' : '⚠️ ');
      const label = critical ? '(critical)' : '(optional)';

      console.log(`${status} ${name.padEnd(20)} ${count.toString().padStart(4)} matches  ${label}`);

      if (count === 0 && critical) {
        criticalFailures++;
      }
    } catch (error) {
      console.log(`❌ ${name.padEnd(20)} ERROR: Invalid selector`);
      if (critical) criticalFailures++;
    }
  }

  console.log('');

  // Test if we can extract actual data from the first card
  const cardCount = await page.locator(SELECTORS.searchResults.listingCard).count();

  if (cardCount > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Sample Data Extraction (First Card)');
    console.log('═══════════════════════════════════════════════════════\n');

    const firstCard = page.locator(SELECTORS.searchResults.listingCard).first();

    try {
      const priceText = await firstCard
        .locator(SELECTORS.searchResults.price)
        .first()
        .textContent()
        .catch(() => null);
      console.log(`💰 Price:      ${priceText || '(not found)'}`);
    } catch {
      console.log('💰 Price:      ERROR');
    }

    try {
      const addressText = await firstCard
        .locator(SELECTORS.searchResults.address)
        .first()
        .textContent()
        .catch(() => null);
      console.log(`📍 Address:    ${addressText?.trim() || '(not found)'}`);
    } catch {
      console.log('📍 Address:    ERROR');
    }

    try {
      const link = await firstCard
        .locator(SELECTORS.searchResults.detailLink)
        .first()
        .getAttribute('href')
        .catch(() => null);
      console.log(`🔗 Link:       ${link || '(not found)'}`);
    } catch {
      console.log('🔗 Link:       ERROR');
    }

    try {
      const mlsText = await firstCard
        .locator(SELECTORS.searchResults.mlsNumber)
        .first()
        .textContent()
        .catch(() => null);
      console.log(`🏷️  MLS:        ${mlsText?.trim() || '(not found)'}`);
    } catch {
      console.log('🏷️  MLS:        ERROR');
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════\n');

  if (criticalFailures === 0 && cardCount > 0) {
    console.log('✅ All critical selectors working!');
    console.log(`   Found ${cardCount} listing cards.`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run tests: npm test');
    console.log('  2. Try real scrape: npm run scrape');
  } else if (criticalFailures > 0) {
    console.log(`❌ ${criticalFailures} critical selector(s) failed.`);
    console.log('');
    console.log('To fix:');
    console.log('  1. Open the HTML file in a browser');
    console.log('  2. Use DevTools to find correct selectors');
    console.log('  3. Update SELECTORS in parser.service.ts');
    console.log('  4. Run this check again');
    console.log('');
    console.log('See: SELECTOR-GUIDE.md for detailed instructions');
  } else {
    console.log('⚠️  No listing cards found.');
    console.log('');
    console.log('Possible causes:');
    console.log('  1. Wrong HTML file (not search results page)');
    console.log('  2. Page has no listings (empty search)');
    console.log('  3. listingCard selector is incorrect');
    console.log('');
    console.log('Try:');
    console.log('  npm run test-selectors');
    console.log('  → Use "cards" command to test card selectors');
  }

  console.log('');

  await browser.close();

  process.exit(criticalFailures > 0 ? 1 : 0);
}

checkSelectors();
