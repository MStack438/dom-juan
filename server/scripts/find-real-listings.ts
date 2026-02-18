#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  const url = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })).newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(10000); // Wait longer

  // Check for iframes
  const frames = page.frames();
  console.log(`Total frames: ${frames.length}`);

  // Search the main page
  const analysis = await page.evaluate(() => {
    const body = document.body.innerHTML;
    const hasListings = body.toLowerCase().includes('mls') || body.toLowerCase().includes('listing');
    
    // Find any divs with price-like content
    const allText = document.body.textContent || '';
    const priceMatches = allText.match(/\$[\d,]+/g);
    
    // Find links with real-estate in href
    const reLinks = Array.from(document.querySelectorAll('a'))
      .filter(a => a.href && a.href.includes('/real-estate/'));

    return {
      bodyLength: body.length,
      hasMLSMention: hasListings,
      priceCount: priceMatches?.length || 0,
      samplePrices: priceMatches?.slice(0, 5) || [],
      realEstateLinksCount: reLinks.length,
      sampleLinks: reLinks.slice(0, 3).map(a => ({
        href: a.href,
        text: a.textContent?.substring(0, 50),
      })),
    };
  });

  console.log('\n📊 Page Analysis:');
  console.log(JSON.stringify(analysis, null, 2));

  await browser.close();
}

main().catch(console.error);
