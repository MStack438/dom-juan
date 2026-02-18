#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  console.log('🥷 Testing stealth techniques to bypass Incapsula...\n');

  const browser = await chromium.launch({ 
    headless: false, // Try non-headless first - harder to detect
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/Montreal',
    permissions: [],
    // Add realistic browser features
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    },
  });

  // Override navigator properties to hide automation
  await context.addInitScript(() => {
    // Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Add chrome object
    (window as any).chrome = {
      runtime: {},
    };

    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: 'denied' } as PermissionStatus)
        : originalQuery(parameters);

    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  const page = await context.newPage();

  const url = 'https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=300000&TransactionTypeId=2';

  console.log('🌐 Navigating to Realtor.ca...');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('⏳ Simulating human behavior...');
  
  // Simulate human-like behavior
  await page.mouse.move(100, 100);
  await page.waitForTimeout(1000);
  await page.mouse.move(200, 300);
  await page.waitForTimeout(2000);
  
  // Scroll like a human
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollBy(0, -100));
  await page.waitForTimeout(3000);

  // Check result
  const result = await page.evaluate(() => {
    const bodyText = document.body.textContent || '';
    const isBlocked = bodyText.includes('Incapsula') || bodyText.includes('Access Denied');
    const cardCount = document.querySelectorAll('div.listingCard').length;
    const title = document.title;
    
    return { isBlocked, cardCount, title, bodySnippet: bodyText.substring(0, 200) };
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 STEALTH TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Blocked by Incapsula: ${result.isBlocked ? '❌ YES' : '✅ NO'}`);
  console.log(`Cards found: ${result.cardCount}`);
  console.log(`Page title: ${result.title}`);
  console.log(`Body snippet: ${result.bodySnippet}`);

  if (!result.isBlocked && result.cardCount > 0) {
    console.log('\n✅ SUCCESS! Evasion techniques worked!');
    
    // Extract a sample listing
    const sample = await page.evaluate(() => {
      const card = document.querySelector('div.listingCard');
      if (!card) return null;
      
      const link = card.querySelector('a[href*="/real-estate/"]');
      const price = card.querySelector('[class*="Price"]');
      const address = card.querySelector('[class*="Address"]');
      
      return {
        href: link?.getAttribute('href'),
        price: price?.textContent,
        address: address?.textContent?.trim().substring(0, 80),
      };
    });
    
    console.log('\nSample listing:', sample);
  } else {
    console.log('\n❌ Still blocked. Need more advanced techniques.');
  }

  await page.waitForTimeout(3000);
  await browser.close();
}

main().catch(console.error);
