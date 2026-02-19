#!/usr/bin/env tsx
import './load-env.js';
import { db } from '../src/db/index.js';
import { trackingList } from '../src/db/schema/tracking-list.js';
import { eq } from 'drizzle-orm';
import { chromium } from 'playwright';
import { parseSearchResults } from '../src/services/scraper/parser.service.js';
import { getFingerprint } from '../src/services/scraper/stealth/fingerprint.service.js';
import { injectStealthScripts } from '../src/services/scraper/stealth/stealth-injection.service.js';

async function testRealtorOnly() {
  // Fetch the Realtor test list
  const [list] = await db
    .select()
    .from(trackingList)
    .where(eq(trackingList.name, 'Test Montreal Houses'));

  if (!list) {
    console.error('Test list not found!');
    process.exit(1);
  }

  console.log(`\nTesting Realtor scrape with list: ${list.name}`);
  console.log(`URL: ${list.customUrl}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const fingerprint = await getFingerprint();
  const context = await browser.newContext({
    userAgent: fingerprint.userAgent,
    viewport: { width: 1920, height: 1080 },
  });

  await injectStealthScripts(context);

  const page = await context.newPage();

  console.log('[Navigation] Loading page...');
  await page.goto(list.customUrl!, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForTimeout(10000);

  console.log('[Parsing] Extracting listings...');
  const results = await parseSearchResults(page);

  console.log(`\n✅ Parse complete!`);
  console.log(`   Total results: ${results.length}`);

  if (results.length > 0) {
    console.log(`\n📋 First 3 listings:\n`);
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const r = results[i];
      console.log(`[${i + 1}] ${r.address}`);
      console.log(`    Price: ${r.price}`);
      console.log(`    Link: ${r.detailUrl}`);
      console.log(`    Beds: ${r.beds || 'N/A'} | Baths: ${r.baths || 'N/A'}`);
      console.log('');
    }
  }

  await browser.close();
  process.exit(0);
}

testRealtorOnly();
