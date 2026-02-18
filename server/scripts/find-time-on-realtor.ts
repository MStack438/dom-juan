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
  
  console.log('🔍 Searching for "Time on Realtor.ca" field...\n');
  
  await page.goto('https://www.realtor.ca/real-estate/29373127/3407z-rue-joachim-du-bellay-laval-chomedey-others', { 
    waitUntil: 'domcontentloaded', 
    timeout: 45000 
  });
  await page.waitForTimeout(8000);

  // Search for the Property Summary section and Time on Realtor.ca
  const timeData = await page.evaluate(() => {
    const bodyText = document.body.textContent || '';
    
    // Look for "Time on Realtor.ca" or "Time on REALTOR.ca"
    const patterns = [
      /Time on Realtor\.ca[:\s]*(\d+)\s*(day|week|month)s?/i,
      /Time on REALTOR\.ca[:\s]*(\d+)\s*(day|week|month)s?/i,
    ];
    
    let match = null;
    for (const pattern of patterns) {
      match = bodyText.match(pattern);
      if (match) break;
    }
    
    // Find Property Summary section
    const propertySummary = Array.from(document.querySelectorAll('*'))
      .find(el => el.textContent?.includes('Property Summary'));
    
    const summaryHTML = propertySummary?.innerHTML || '';
    const summaryText = propertySummary?.textContent || '';
    
    // Look for all fields in Property Summary
    const summaryFields = summaryText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 200);
    
    return {
      foundMatch: match ? match[0] : null,
      summaryFields: summaryFields.slice(0, 30),
      summaryHTML: summaryHTML.substring(0, 1500),
    };
  });

  console.log('═══════════════════════════════════');
  console.log('SEARCH RESULTS:');
  console.log('═══════════════════════════════════');
  
  if (timeData.foundMatch) {
    console.log(`\n✅ FOUND: "${timeData.foundMatch}"\n`);
  } else {
    console.log('\n❌ Pattern not found in body text\n');
  }
  
  console.log('Property Summary Fields:');
  console.log('───────────────────────────────────');
  timeData.summaryFields.forEach((field, i) => {
    if (field.toLowerCase().includes('time') || 
        field.toLowerCase().includes('realtor') ||
        field.toLowerCase().includes('day') ||
        field.toLowerCase().includes('week')) {
      console.log(`>>> ${i + 1}. ${field}`);
    } else {
      console.log(`    ${i + 1}. ${field}`);
    }
  });
  
  console.log('\n═══════════════════════════════════');
  console.log('Property Summary HTML (partial):');
  console.log('═══════════════════════════════════');
  console.log(timeData.summaryHTML);

  await page.waitForTimeout(3000);
  await browser.close();
}

main().catch(console.error);
