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
  
  console.log('🔍 Extracting Property Summary section...\n');
  
  await page.goto('https://www.realtor.ca/real-estate/29373127/3407z-rue-joachim-du-bellay-laval-chomedey-others', { 
    waitUntil: 'domcontentloaded', 
    timeout: 45000 
  });
  await page.waitForTimeout(8000);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(2000);

  // Find all h2 or h3 headings and their following content
  const sections = await page.evaluate(() => {
    // Find Property Summary heading
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
    const propertySummaryHeading = headings.find(h => 
      h.textContent?.trim() === 'Property Summary'
    );
    
    if (!propertySummaryHeading) {
      return { found: false, sections: [] };
    }
    
    // Get the next sibling or parent's next sibling content
    let contentElement = propertySummaryHeading.nextElementSibling;
    if (!contentElement && propertySummaryHeading.parentElement) {
      contentElement = propertySummaryHeading.parentElement.nextElementSibling;
    }
    
    // Extract all text content from the Property Summary section
    const rows = contentElement ? 
      Array.from(contentElement.querySelectorAll('div, li, tr, span'))
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 2 && text.length < 150) :
      [];
    
    // Also get the entire body text to search
    const bodyText = document.body.textContent || '';
    
    // Search for "Time on" pattern
    const timeMatch = bodyText.match(/Time on [A-Z\.]+\s*:?\s*(\d+\s+\w+)/i);
    
    return {
      found: true,
      propertyRows: [...new Set(rows)].slice(0, 40),
      timeOnRealtorMatch: timeMatch ? timeMatch[0] : null,
      fullTimeMatch: timeMatch,
    };
  });

  if (!sections.found) {
    console.log('❌ Property Summary section not found\n');
  } else {
    console.log('═══════════════════════════════════');
    console.log('Property Summary Content:');
    console.log('═══════════════════════════════════\n');
    
    sections.propertyRows.forEach((row, i) => {
      const highlight = row.toLowerCase().includes('time') || 
                       row.toLowerCase().includes('realtor') ||
                       row.toLowerCase().includes('day');
      console.log(`${highlight ? '>>> ' : '    '}${row}`);
    });
    
    if (sections.timeOnRealtorMatch) {
      console.log('\n═══════════════════════════════════');
      console.log('✅ FOUND:');
      console.log('═══════════════════════════════════');
      console.log(`"${sections.timeOnRealtorMatch}"`);
      console.log('\nFull match:', sections.fullTimeMatch);
    }
  }

  await page.waitForTimeout(3000);
  await browser.close();
}

main().catch(console.error);
