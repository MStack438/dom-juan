#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function main() {
  const url = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })).newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(12000);

  const frames = page.frames();
  console.log(`\n🔍 Searching ${frames.length} iframes for listings...\n`);

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    try {
      const analysis = await frame.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
          .filter(a => a.href && (a.href.includes('/real-estate/') || a.href.includes('MLS')));
        const prices = (document.body.textContent || '').match(/\$[\d,]+/g);
        
        return {
          url: window.location.href,
          linkCount: links.length,
          priceCount: prices?.length || 0,
          sampleLink: links[0] ? {
            href: links[0].href,
            text: links[0].textContent?.substring(0, 60),
          } : null,
        };
      });

      if (analysis.linkCount > 0 || analysis.priceCount > 0) {
        console.log(`✅ Frame ${i}: FOUND CONTENT!`);
        console.log(`   URL: ${analysis.url}`);
        console.log(`   Links: ${analysis.linkCount}, Prices: ${analysis.priceCount}`);
        if (analysis.sampleLink) {
          console.log(`   Sample: ${analysis.sampleLink.text}`);
          console.log(`   Href: ${analysis.sampleLink.href}`);
        }
        
        // Save this frame's HTML
        const html = await frame.content();
        writeFileSync(`/tmp/realtor-frame-${i}.html`, html);
        console.log(`   Saved to /tmp/realtor-frame-${i}.html\n`);
      }
    } catch (e) {
      // Skip frames we can't access
    }
  }

  await browser.close();
}

main().catch(console.error);
