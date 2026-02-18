#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function setupStealthBrowser() {
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
      'Accept-Language': 'en-CA,en-US;q=0.9',
      'sec-ch-ua': '"Google Chrome";v="131"',
      'sec-ch-ua-platform': '"macOS"',
    },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    (window as any).chrome = { runtime: {} };
  });

  return { browser, context };
}

async function main() {
  console.log('📅 Checking for listing date information on Realtor.ca...\n');

  const { browser, context } = await setupStealthBrowser();
  const page = await context.newPage();

  const url = 'https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=500000&TransactionTypeId=2';

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Extract date information from listing cards
  const dateInfo = await page.evaluate(() => {
    const cards = document.querySelectorAll('div.listingCard');
    const samples = [];

    for (let i = 0; i < Math.min(5, cards.length); i++) {
      const card = cards[i];
      
      // Look for date-related elements
      const allText = card.textContent || '';
      const html = card.innerHTML;
      
      // Common patterns for dates
      const datePatterns = [
        /listed[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /listed[:\s]*(\d+)\s*days?\s*ago/i,
        /(\d{1,2}\/\d{1,2}\/\d{4})/,
        /days?\s*on\s*market[:\s]*(\d+)/i,
        /DOM[:\s]*(\d+)/i, // Days on Market
        /new\s*listing/i,
      ];

      const dateMatches = datePatterns.map(pattern => {
        const match = allText.match(pattern);
        return match ? match[0] : null;
      }).filter(Boolean);

      // Look for specific date selectors
      const dateElements = Array.from(card.querySelectorAll('[class*="date"], [class*="Date"], [class*="listed"], [class*="Listed"], [class*="days"], [class*="Days"]'));
      
      const mls = card.querySelector('[class*="MLS"]')?.textContent?.trim();
      const price = card.querySelector('[class*="Price"]')?.textContent?.trim();

      samples.push({
        mls,
        price,
        dateMatches,
        dateElements: dateElements.map(el => ({
          class: el.className,
          text: el.textContent?.trim().substring(0, 100),
        })),
        hasNewBadge: html.includes('new') || html.includes('New') || html.includes('NEW'),
      });
    }

    return samples;
  });

  console.log('📊 Date Information Found:\n');
  dateInfo.forEach((info, i) => {
    console.log(`Card ${i + 1}:`);
    console.log(`  MLS: ${info.mls}`);
    console.log(`  Price: ${info.price}`);
    console.log(`  Date matches: ${info.dateMatches.length > 0 ? JSON.stringify(info.dateMatches) : 'None'}`);
    console.log(`  Date elements: ${info.dateElements.length > 0 ? JSON.stringify(info.dateElements, null, 2) : 'None'}`);
    console.log(`  Has "new" badge: ${info.hasNewBadge}`);
    console.log('');
  });

  // Now check a detail page for more date info
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Checking DETAIL page for date info...\n');

  const firstLink = await page.locator('div.listingCard a[href*="/real-estate/"]').first().getAttribute('href');
  if (firstLink) {
    const detailUrl = firstLink.startsWith('http') ? firstLink : `https://www.realtor.ca${firstLink}`;
    console.log(`Detail URL: ${detailUrl}\n`);

    await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    const detailDates = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      
      const patterns = [
        /listed[:\s]*on[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
        /list\s*date[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        /days?\s*on\s*(the\s*)?market[:\s]*(\d+)/i,
      ];

      const matches = patterns.map(p => {
        const m = bodyText.match(p);
        return m ? m[0] : null;
      }).filter(Boolean);

      return {
        matches,
        hasListingDate: bodyText.toLowerCase().includes('listing date') || bodyText.toLowerCase().includes('list date'),
        hasDaysOnMarket: bodyText.toLowerCase().includes('days on market') || bodyText.toLowerCase().includes('dom'),
      };
    });

    console.log('Detail page date info:', JSON.stringify(detailDates, null, 2));
  }

  await browser.close();
}

main().catch(console.error);
