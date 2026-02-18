#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { SELECTORS } from '../src/services/scraper/parser.service.js';

async function main() {
  const listViewUrl = 'https://www.realtor.ca/qc/montreal/real-estate?PriceMax=300000&TransactionTypeId=2&PropertyTypeGroupID=1&Sort=6-D';
  
  console.log('🧪 Testing selectors on LIST VIEW...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })).newPage();
  
  await page.goto(listViewUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  // Test our current selectors
  const cards = await page.locator(SELECTORS.searchResults.listingCard).all();
  console.log(`✅ Found ${cards.length} cards with current selector\n`);
  
  if (cards[0]) {
    console.log('=== TESTING FIRST CARD ===\n');
    
    // Test link extraction
    const linkTest = await cards[0].evaluate((el) => {
      const link = el.querySelector('a[href*="/real-estate/"]');
      return {
        found: !!link,
        href: link?.getAttribute('href'),
        text: link?.textContent?.trim().substring(0, 100),
      };
    });
    console.log('Link test:', linkTest);
    
    // Test price extraction
    const priceTest = await cards[0].evaluate((el) => {
      const priceSelectors = [
        '[data-testid*="price"]',
        '[class*="Price"]',
        '[class*="price"]',
      ];
      
      for (const sel of priceSelectors) {
        const elem = el.querySelector(sel);
        if (elem) {
          return {
            selector: sel,
            text: elem.textContent?.trim(),
          };
        }
      }
      
      // Fallback: search for $ patterns
      const text = el.textContent || '';
      const match = text.match(/\$[\d,]+/);
      return {
        selector: 'text-search',
        text: match?.[0],
      };
    });
    console.log('Price test:', priceTest);
    
    // Test address extraction
    const addressTest = await cards[0].evaluate((el) => {
      const addressSelectors = [
        '[data-testid*="address"]',
        '[class*="Address"]',
        '[class*="address"]',
      ];
      
      for (const sel of addressSelectors) {
        const elem = el.querySelector(sel);
        if (elem) {
          return {
            selector: sel,
            text: elem.textContent?.trim(),
          };
        }
      }
      
      return { selector: 'not-found', text: null };
    });
    console.log('Address test:', addressTest);
    
    // Dump first card HTML for analysis
    const html = await cards[0].innerHTML();
    console.log('\n=== FIRST CARD HTML (first 1000 chars) ===');
    console.log(html.substring(0, 1000));
  }
  
  await browser.close();
}

main().catch(console.error);
