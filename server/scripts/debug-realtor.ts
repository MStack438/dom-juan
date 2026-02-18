#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function main() {
  const url = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();

  console.log('Loading page...');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(12000); // Wait even longer

  console.log('Searching for any content...\n');

  const analysis = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    const allAs = document.querySelectorAll('a');
    const body = document.body.innerHTML;

    // Find divs with listing-related classes
    const listingDivs = Array.from(allDivs).filter(d => 
      d.className && (
        d.className.toLowerCase().includes('listing') ||
        d.className.toLowerCase().includes('card') ||
        d.className.toLowerCase().includes('property')
      )
    );

    // Find links with real-estate in href
    const realEstateLinks = Array.from(allAs).filter(a => 
      a.href && (
        a.href.includes('/real-estate/') ||
        a.href.includes('/property') ||
        a.href.includes('MLS')
      )
    );

    return {
      totalDivs: allDivs.length,
      totalLinks: allAs.length,
      listingDivCount: listingDivs.length,
      realEstateLinksCount: realEstateLinks.length,
      firstListingDiv: listingDivs[0] ? {
        classes: listingDivs[0].className,
        id: listingDivs[0].id,
        html: listingDivs[0].outerHTML.substring(0, 800),
      } : null,
      firstRELink: realEstateLinks[0] ? {
        href: realEstateLinks[0].href,
        classes: realEstateLinks[0].className,
        text: realEstateLinks[0].textContent?.substring(0, 100),
      } : null,
      bodyLength: body.length,
      hasIncapsula: body.includes('Incapsula'),
      sampleHTML: body.substring(0, 2000),
    };
  });

  console.log(JSON.stringify(analysis, null, 2));

  const html = await page.content();
  writeFileSync('/Users/mariejoseeherard/Desktop/dom-juan/realtor-debug.html', html);
  console.log('\n✓ Saved to realtor-debug.html');

  await browser.close();
}

main().catch(console.error);
