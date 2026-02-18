#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  const url = 'https://www.realtor.ca/qc/greater-montreal/real-estate?TransactionTypeId=2&PriceMax=300000&Sort=1-D';

  console.log('📸 Taking screenshot of Realtor.ca page...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/realtor-blocked.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/realtor-blocked.png');

  // Get page info
  const info = await page.evaluate(() => {
    const title = document.title;
    const bodyText = document.body.textContent?.substring(0, 500);
    const cardCount = document.querySelectorAll('div.listingCard').length;
    
    return { title, bodyText, cardCount };
  });

  console.log('\n📄 Page Info:');
  console.log(`   Title: ${info.title}`);
  console.log(`   Cards found: ${info.cardCount}`);
  console.log(`\n   Body text preview:`);
  console.log(`   ${info.bodyText}`);

  await browser.close();
}

main().catch(console.error);
