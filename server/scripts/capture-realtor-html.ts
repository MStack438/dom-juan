#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function main() {
  const url = 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  console.log('🔍 Capturing Realtor.ca HTML structure...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  const analysis = await page.evaluate(() => {
    const cards = document.querySelectorAll('article, div[class*="Card"], div[class*="card"]');
    const links = document.querySelectorAll('a');
    
    const card = cards[0];
    if (!card) return { error: 'No cards found' };

    const cardLinks = card.querySelectorAll('a');
    const realEstateLink = Array.from(cardLinks).find(a => 
      a.href.includes('/real-estate/') || a.href.includes('/property')
    );

    return {
      totalCards: cards.length,
      totalLinks: links.length,
      cardTag: card.tagName,
      cardClasses: card.className,
      cardId: card.id,
      linkFound: !!realEstateLink,
      linkHref: realEstateLink?.href || 'NONE',
      linkClasses: realEstateLink?.className || 'NONE',
      linkText: realEstateLink?.textContent?.trim().substring(0, 50) || 'NONE',
      cardHTML: card.outerHTML.substring(0, 1500),
    };
  });

  console.log('📊 Analysis Results:\n');
  console.log(JSON.stringify(analysis, null, 2));
  
  await browser.close();
}

main().catch(console.error);
