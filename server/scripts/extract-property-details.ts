#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();
  await page.goto('https://www.realtor.ca/real-estate/29373127/3407z-rue-joachim-du-bellay-laval-chomedey-others', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(8000);

  // Extract all property detail fields
  const details = await page.evaluate(() => {
    const allText = document.body.textContent || '';
    
    // Look for all key-value pairs in the property details
    const detailRows = Array.from(document.querySelectorAll('[class*="detail"], [class*="property"], [class*="info"]'))
      .map(el => el.textContent?.trim())
      .filter(text => text && text.length > 0 && text.length < 200);

    // Search for specific date-related keywords
    const dateKeywords = ['listed', 'date', 'days', 'market', 'posted', 'added', 'published', 'updated', 'modified'];
    const dateRelated = detailRows.filter(text => 
      dateKeywords.some(keyword => text.toLowerCase().includes(keyword))
    );

    // Get full property summary section
    const summarySection = document.querySelector('[class*="property"]')?.textContent || '';

    return {
      allDateRelated: dateRelated,
      summarySnippet: summarySection.substring(0, 1000),
      bodySearchResults: dateKeywords.map(keyword => ({
        keyword,
        found: allText.toLowerCase().includes(keyword),
        context: allText.toLowerCase().includes(keyword) ? 
          allText.substring(allText.toLowerCase().indexOf(keyword) - 50, allText.toLowerCase().indexOf(keyword) + 100) : null
      })),
    };
  });

  console.log('═══════════════════════════════════');
  console.log('Date-Related Fields Found:');
  console.log('═══════════════════════════════════');
  details.allDateRelated.forEach((text, i) => {
    console.log(`${i + 1}. ${text}`);
  });

  console.log('\n═══════════════════════════════════');
  console.log('Keyword Search Results:');
  console.log('═══════════════════════════════════');
  details.bodySearchResults.forEach(result => {
    if (result.found) {
      console.log(`\n"${result.keyword}" FOUND:`);
      console.log(`  Context: ...${result.context}...`);
    }
  });

  await page.waitForTimeout(3000);
  await browser.close();
}

main().catch(console.error);
