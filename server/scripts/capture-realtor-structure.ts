import { chromium } from 'playwright';

async function captureRealtorStructure() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to Realtor.ca...');
    await page.goto('https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for content
    await page.waitForTimeout(10000);

    // Try to find listing cards with multiple strategies
    console.log('\n=== SEARCHING FOR LISTING CARDS ===');

    const selectors = [
      'div.listingCard',
      'li.cardCon',
      '[data-testid*="listing"]',
      '[class*="listing"]',
      '[class*="card"]',
      'article',
      '[role="article"]',
    ];

    let foundSelector = null;
    let cardCount = 0;

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements`);
      if (count > 0 && !foundSelector) {
        foundSelector = selector;
        cardCount = count;
      }
    }

    if (foundSelector) {
      console.log(`\n✓ Using selector: ${foundSelector} (${cardCount} cards found)`);

      // Get the first card's HTML
      const firstCard = page.locator(foundSelector).first();
      const cardHTML = await firstCard.innerHTML();

      console.log('\n=== FIRST CARD HTML (truncated) ===');
      console.log(cardHTML.substring(0, 2000));

      // Look for links
      const links = await firstCard.locator('a').all();
      console.log(`\n=== FOUND ${links.length} LINKS IN CARD ===`);

      for (let i = 0; i < Math.min(links.length, 5); i++) {
        const href = await links[i].getAttribute('href');
        const text = await links[i].textContent();
        const classes = await links[i].getAttribute('class');
        console.log(`Link ${i + 1}:`);
        console.log(`  href: ${href}`);
        console.log(`  text: ${text?.substring(0, 50)}`);
        console.log(`  class: ${classes}`);
      }

      // Get all attributes of the card
      const cardElement = await firstCard.elementHandle();
      const attributes = await cardElement?.evaluate((el) => {
        const attrs: Record<string, string> = {};
        for (const attr of el.attributes) {
          attrs[attr.name] = attr.value;
        }
        return attrs;
      });

      console.log('\n=== CARD ATTRIBUTES ===');
      console.log(JSON.stringify(attributes, null, 2));
    } else {
      console.log('\n✗ No listing cards found with any selector');

      // Capture full page HTML for analysis
      const html = await page.content();
      console.log('\n=== PAGE HTML (first 3000 chars) ===');
      console.log(html.substring(0, 3000));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

captureRealtorStructure();
