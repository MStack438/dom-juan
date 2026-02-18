#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ 
    headless: false, // Use visible browser
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  // Go directly to a known listing
  const url = 'https://www.realtor.ca/real-estate/29373127/3407z-rue-joachim-du-bellay-laval-chomedey-others';
  
  console.log(`📸 Loading detail page: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(8000);

  // Scroll to see all content
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/realtor-detail-full.png', fullPage: true });
  console.log('✅ Full page screenshot saved to /tmp/realtor-detail-full.png');

  // Check what's on the page
  const pageContent = await page.evaluate(() => {
    return {
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean).slice(0, 10),
      hasIncapsula: document.body.textContent?.includes('Incapsula'),
    };
  });

  console.log('\nPage content:', JSON.stringify(pageContent, null, 2));

  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch(console.error);
