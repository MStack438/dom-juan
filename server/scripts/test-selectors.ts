#!/usr/bin/env tsx
/**
 * Interactive tool to test CSS selectors against saved HTML.
 *
 * Usage:
 *   tsx scripts/test-selectors.ts
 *   tsx scripts/test-selectors.ts fixtures/realtor-search-2025-01-15.html
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { chromium } from 'playwright';
import * as readline from 'readline';

// Find the most recent fixture file
function findLatestFixture(): string | null {
  const fixturesDir = join(process.cwd(), 'src', 'services', 'scraper', 'fixtures');

  try {
    const files = readdirSync(fixturesDir)
      .filter((f) => f.endsWith('.html') && f.includes('realtor'))
      .sort()
      .reverse();

    return files.length > 0 ? join(fixturesDir, files[0]) : null;
  } catch {
    return null;
  }
}

async function testSelectors() {
  const htmlPath = process.argv[2] || findLatestFixture();

  if (!htmlPath) {
    console.error('❌ No HTML fixture found.');
    console.error('Run: npm run capture-html');
    console.error('Or specify path: tsx scripts/test-selectors.ts path/to/file.html');
    process.exit(1);
  }

  console.log(`📄 Loading HTML from: ${htmlPath}`);
  const html = readFileSync(htmlPath, 'utf-8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);

  console.log('✅ HTML loaded into Playwright\n');

  // Create readline interface for interactive input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  console.log('═══════════════════════════════════════════════════════');
  console.log('  CSS Selector Testing Tool');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Commands:');
  console.log('  count <selector>     - Count elements matching selector');
  console.log('  text <selector>      - Get text content of first match');
  console.log('  attr <selector> <attr> - Get attribute value');
  console.log('  html <selector>      - Get outer HTML of first match');
  console.log('  cards                - Test listing card selectors');
  console.log('  quit / exit          - Exit');
  console.log('');

  let running = true;

  while (running) {
    const input = await prompt('> ');
    const [command, ...args] = input.trim().split(/\s+/);

    try {
      switch (command.toLowerCase()) {
        case 'quit':
        case 'exit':
          running = false;
          break;

        case 'count': {
          const selector = args.join(' ');
          const count = await page.locator(selector).count();
          console.log(`Found ${count} elements matching: ${selector}\n`);
          break;
        }

        case 'text': {
          const selector = args.join(' ');
          const elements = await page.locator(selector).all();
          if (elements.length === 0) {
            console.log(`No elements found matching: ${selector}\n`);
          } else {
            console.log(`Found ${elements.length} elements:`);
            for (let i = 0; i < Math.min(elements.length, 5); i++) {
              const text = await elements[i].textContent();
              console.log(`  [${i + 1}] ${text?.trim().substring(0, 100) || '(empty)'}`);
            }
            if (elements.length > 5) {
              console.log(`  ... and ${elements.length - 5} more`);
            }
            console.log('');
          }
          break;
        }

        case 'attr': {
          const selector = args.slice(0, -1).join(' ');
          const attrName = args[args.length - 1];
          const element = page.locator(selector).first();
          const attrValue = await element.getAttribute(attrName);
          console.log(`${attrName} = ${attrValue || '(null)'}\n`);
          break;
        }

        case 'html': {
          const selector = args.join(' ');
          const element = page.locator(selector).first();
          const html = await element.evaluate((el) => el.outerHTML);
          console.log(html.substring(0, 500));
          if (html.length > 500) {
            console.log(`... (${html.length - 500} more characters)`);
          }
          console.log('');
          break;
        }

        case 'cards': {
          console.log('Testing listing card selectors:\n');
          const selectors = [
            'article',
            '[role="article"]',
            '[data-testid*="listing"]',
            '[data-testid*="card"]',
            '[class*="ListingCard"]',
            '[class*="PropertyCard"]',
            '[class*="listing"]',
            '[class*="card"]',
            '.listing',
            '.card',
          ];

          for (const selector of selectors) {
            try {
              const count = await page.locator(selector).count();
              if (count > 0) {
                console.log(`  ✓ ${selector.padEnd(35)} → ${count} matches`);
              }
            } catch {
              // Invalid selector, skip
            }
          }
          console.log('');
          break;
        }

        case 'help':
        case '?':
          console.log('Commands:');
          console.log('  count <selector>     - Count elements');
          console.log('  text <selector>      - Get text content');
          console.log('  attr <selector> <attr> - Get attribute');
          console.log('  html <selector>      - Get HTML');
          console.log('  cards                - Test card selectors');
          console.log('  quit                 - Exit\n');
          break;

        case '':
          break;

        default:
          console.log(`Unknown command: ${command}`);
          console.log('Type "help" for available commands\n');
      }
    } catch (error) {
      console.error(`Error: ${error}\n`);
    }
  }

  rl.close();
  await browser.close();
  console.log('👋 Bye!');
}

testSelectors();
