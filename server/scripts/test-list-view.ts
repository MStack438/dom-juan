#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  // This is the list view URL format (not map view)
  const listViewUrl = 'https://www.realtor.ca/qc/montreal/real-estate?PriceMax=300000&TransactionTypeId=2&PropertyTypeGroupID=1&Sort=6-D';
  
  console.log('🔍 Testing Realtor.ca LIST VIEW...\n');
  console.log('URL:', listViewUrl);
  
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })).newPage();
  
  await page.goto(listViewUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  // Check what we get
  const analysis = await page.evaluate(() => {
    // Look for listing cards
    const articles = document.querySelectorAll('article');
    const divs = document.querySelectorAll('[class*="card"]');
    const links = document.querySelectorAll('a[href*="/real-estate/"]');
    
    return {
      articleCount: articles.length,
      cardDivCount: divs.length,
      realEstateLinks: links.length,
      sampleLinks: Array.from(links).slice(0, 3).map(a => ({
        href: (a as HTMLAnchorElement).href,
        text: a.textContent?.substring(0, 60),
      })),
      bodyClasses: document.body.className,
      hasMapElement: !!document.querySelector('[class*="map"]'),
    };
  });
  
  console.log('\n📊 Analysis:');
  console.log(JSON.stringify(analysis, null, 2));
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/realtor-list-view.png', fullPage: false });
  console.log('\n📸 Screenshot saved to /tmp/realtor-list-view.png');
  
  await browser.close();
}

main().catch(console.error);
