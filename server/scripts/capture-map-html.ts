#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function captureMapHTML() {
  const browser = await chromium.launch({
    headless: true,
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

  const mapUrl = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  console.log('Capturing MAP VIEW HTML...');
  await page.goto(mapUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await page.waitForTimeout(12000);

  const html = await page.content();
  const outputPath = join(process.cwd(), 'server/fixtures/realtor-map-view.html');
  writeFileSync(outputPath, html);

  console.log(`\n✅ Saved to: ${outputPath}`);
  console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB\n`);

  // Check for listings in sidebar
  console.log('=== Checking for common map view patterns ===');
  const patterns = [
    { name: 'Listings container', selector: '[class*="listings"]' },
    { name: 'Results list', selector: '[class*="results"]' },
    { name: 'Sidebar panel', selector: '[class*="sidebar"]' },
    { name: 'List view', selector: '[class*="listView"]' },
    { name: 'Property items', selector: '[class*="propertyItem"]' },
    { name: 'Card list', selector: 'ul[class*="card"]' },
  ];

  for (const { name, selector } of patterns) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✓ ${name} (${selector}): ${count}`);
      if (count <= 3) {
        const elements = await page.locator(selector).all();
        for (let i = 0; i < elements.length; i++) {
          const classes = await elements[i].getAttribute('class');
          console.log(`  [${i + 1}] classes: ${classes}`);
        }
      }
    }
  }

  await browser.close();
}

captureMapHTML().catch(console.error);
