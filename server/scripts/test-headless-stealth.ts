#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  console.log('🥷 Testing HEADLESS stealth (for Railway deployment)...\n');

  const browser = await chromium.launch({ 
    headless: true, // Must work headless for Railway
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--flag-switches-begin',
      '--disable-site-isolation-trials',
      '--flag-switches-end',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-CA',
    timezoneId: 'America/Montreal',
    geolocation: { latitude: 45.5017, longitude: -73.5673 }, // Montreal
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-CA,en-US;q=0.9,en;q=0.8,fr;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
    },
  });

  // More aggressive stealth
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-CA', 'en-US', 'en'] });
    
    (window as any).chrome = { runtime: {}, loadTimes: function() {}, csi: function() {} };
    
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: 'prompt' } as PermissionStatus)
        : originalQuery(parameters);

    // Spoof canvas fingerprint slightly
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
      if (type === 'image/png') {
        const context = this.getContext('2d');
        if (context) {
          context.fillStyle = 'rgba(0,0,0,0.01)';
          context.fillRect(0, 0, 1, 1);
        }
      }
      return originalToDataURL.apply(this, arguments as any);
    };
  });

  const page = await context.newPage();
  const url = 'https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=300000&TransactionTypeId=2';

  console.log('🌐 Navigating...');
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

  console.log('⏳ Simulating human behavior...');
  await page.mouse.move(250, 350);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(2500);
  await page.mouse.move(500, 500);
  await page.waitForTimeout(3000);

  const result = await page.evaluate(() => {
    const bodyText = document.body.textContent || '';
    const isBlocked = bodyText.includes('Incapsula') || bodyText.includes('Access Denied');
    const cardCount = document.querySelectorAll('div.listingCard').length;
    const title = document.title;
    
    return { isBlocked, cardCount, title };
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 HEADLESS STEALTH RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Blocked: ${result.isBlocked ? '❌ YES' : '✅ NO'}`);
  console.log(`Cards: ${result.cardCount}`);
  console.log(`Title: ${result.title}`);

  if (!result.isBlocked && result.cardCount > 0) {
    console.log('\n✅ SUCCESS! Headless stealth works!');
  } else {
    console.log('\n❌ Headless mode still detected.');
  }

  await browser.close();
}

main().catch(console.error);
