#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function setupStealthBrowser() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  return { browser, context };
}

async function main() {
  const { browser, context } = await setupStealthBrowser();
  const page = await context.newPage();

  const url = 'https://www.realtor.ca/qc/greater-montreal/real-estate?PriceMax=500000&TransactionTypeId=2';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  const firstLink = await page.locator('div.listingCard a[href*="/real-estate/"]').first().getAttribute('href');
  const detailUrl = `https://www.realtor.ca${firstLink}`;

  console.log(`🔍 Deep searching for dates on: ${detailUrl}\n`);

  await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Search for structured data, meta tags, and hidden fields
  const detailedSearch = await page.evaluate(() => {
    // Check for JSON-LD structured data
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const jsonLD = scripts.map(s => {
      try {
        return JSON.parse(s.textContent || '');
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Check meta tags
    const metaTags = Array.from(document.querySelectorAll('meta')).map(m => ({
      name: m.getAttribute('name') || m.getAttribute('property'),
      content: m.getAttribute('content'),
    })).filter(m => m.name && (
      m.name.toLowerCase().includes('date') ||
      m.name.toLowerCase().includes('published') ||
      m.name.toLowerCase().includes('modified') ||
      m.name.toLowerCase().includes('list')
    ));

    // Search all text for date-like patterns
    const bodyHTML = document.body.innerHTML;
    const datePatterns = {
      isoDate: bodyHTML.match(/\d{4}-\d{2}-\d{2}/g),
      slashDate: bodyHTML.match(/\d{1,2}\/\d{1,2}\/\d{4}/g),
      monthDayYear: bodyHTML.match(/[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}/g),
      timestamp: bodyHTML.match(/\d{13}/g), // Unix timestamps in ms
    };

    // Look for specific property detail sections
    const detailSections = Array.from(document.querySelectorAll('[class*="property"], [class*="listing"], [class*="detail"]'))
      .map(el => ({
        class: el.className.substring(0, 100),
        text: el.textContent?.substring(0, 200),
      }))
      .filter(s => s.text && (
        s.text.toLowerCase().includes('date') ||
        s.text.toLowerCase().includes('listed') ||
        s.text.toLowerCase().includes('days') ||
        s.text.includes('/')
      ));

    return {
      jsonLD,
      metaTags,
      datePatterns,
      detailSections: detailSections.slice(0, 10),
    };
  });

  console.log('═══════════════════════════════════');
  console.log('JSON-LD Structured Data:');
  console.log('═══════════════════════════════════');
  console.log(JSON.stringify(detailedSearch.jsonLD, null, 2).substring(0, 1000));

  console.log('\n═══════════════════════════════════');
  console.log('Meta Tags with Date Info:');
  console.log('═══════════════════════════════════');
  console.log(JSON.stringify(detailedSearch.metaTags, null, 2));

  console.log('\n═══════════════════════════════════');
  console.log('Date Patterns Found:');
  console.log('═══════════════════════════════════');
  Object.entries(detailedSearch.datePatterns).forEach(([type, dates]) => {
    if (dates && dates.length > 0) {
      console.log(`${type}: ${dates.slice(0, 5).join(', ')}`);
    }
  });

  console.log('\n═══════════════════════════════════');
  console.log('Detail Sections with Date-like Content:');
  console.log('═══════════════════════════════════');
  detailedSearch.detailSections.forEach((section, i) => {
    console.log(`\n${i + 1}. Class: ${section.class}`);
    console.log(`   Text: ${section.text}`);
  });

  await browser.close();
}

main().catch(console.error);
