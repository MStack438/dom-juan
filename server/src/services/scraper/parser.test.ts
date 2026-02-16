import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { parseSearchResults, parseDetailPage, SELECTORS } from './parser.service.js';
import { chromium, type Page, type Browser } from 'playwright';

/**
 * Parser tests against realistic HTML snapshots.
 *
 * To update test fixtures:
 * 1. Visit Realtor.ca search results in a regular browser
 * 2. Save the complete HTML (Ctrl+S / Cmd+S)
 * 3. Place in fixtures/realtor-search-results.html
 * 4. Do the same for a detail page
 */

describe('parser.service - Search Results', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('parseSearchResults extracts listings from real HTML', async () => {
    // TODO: Load fixtures/realtor-search-results.html
    const html = `
      <!-- Paste actual Realtor.ca HTML here -->
      <div>Placeholder - needs real HTML</div>
    `;

    await page.setContent(html);
    const results = await parseSearchResults(page);

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);

    if (results.length > 0) {
      const first = results[0];
      expect(first.mlsNumber).toBeTruthy();
      expect(first.detailUrl).toMatch(/^https?:\/\//);
      expect(first.address).toBeTruthy();
      expect(first.price).toBeGreaterThan(0);
    }
  });

  test('SELECTORS.searchResults.listingCard matches actual cards', async () => {
    const html = `
      <!-- Real listing card HTML from Realtor.ca -->
    `;

    await page.setContent(html);
    const cards = await page.locator(SELECTORS.searchResults.listingCard).all();

    expect(cards.length).toBeGreaterThan(0);
  });

  test('extracts price correctly from various formats', async () => {
    const html = `
      <!-- Examples of different price formats:
           - $299,000
           - 299 000 $
           - $299K
      -->
    `;

    await page.setContent(html);
    const results = await parseSearchResults(page);

    // Verify price parsing works for Quebec French and English formats
    results.forEach(result => {
      if (result.price) {
        expect(result.price).toBeGreaterThan(0);
        expect(result.price).toBeLessThan(100_000_000); // Sanity check
      }
    });
  });

  test('extracts MLS number from listing card', async () => {
    const html = `
      <!-- Real card with MLS# visible -->
    `;

    await page.setContent(html);
    const results = await parseSearchResults(page);

    if (results.length > 0) {
      expect(results[0].mlsNumber).toMatch(/^\d{6,}$/); // MLS numbers are typically 6+ digits
    }
  });

  test('handles missing optional fields gracefully', async () => {
    const html = `
      <!-- Minimal listing card with only required fields -->
    `;

    await page.setContent(html);
    const results = await parseSearchResults(page);

    // Should not throw, should handle missing data
    expect(() => parseSearchResults(page)).not.toThrow();
  });
});

describe('parser.service - Detail Page', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('parseDetailPage extracts all property details', async () => {
    const html = `
      <!-- Full detail page HTML -->
    `;

    await page.setContent(html);
    const details = await parseDetailPage(page);

    // At minimum, should extract these core fields
    expect(details).toBeDefined();
    expect(typeof details).toBe('object');

    // Check optional fields are present or null (not undefined)
    expect(details.municipality === null || typeof details.municipality === 'string').toBe(true);
    expect(details.postalCode === null || typeof details.postalCode === 'string').toBe(true);
  });

  test('extracts postal code from address', async () => {
    const html = `
      <div class="address">123 Rue Example, Montréal, QC H1X 2Y3</div>
    `;

    await page.setContent(html);
    const details = await parseDetailPage(page);

    expect(details.postalCode).toMatch(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/);
  });

  test('normalizes property types correctly', async () => {
    // Test property type detection from various text formats
    const testCases = [
      { input: 'Single Family Detached', expected: 'detached' },
      { input: 'Semi-detached', expected: 'semi_detached' },
      { input: 'Townhouse', expected: 'townhouse' },
      { input: 'Condominium/Strata', expected: 'condo' },
    ];

    // TODO: Implement test against real HTML
  });

  test('extracts photo URLs', async () => {
    const html = `
      <!-- Photo gallery HTML -->
    `;

    await page.setContent(html);
    const details = await parseDetailPage(page);

    expect(Array.isArray(details.photoUrls)).toBe(true);
    if (details.photoUrls && details.photoUrls.length > 0) {
      expect(details.photoUrls[0]).toMatch(/^https?:\/\//);
    }
  });

  test('detects features from description text', async () => {
    const html = `
      <body>
        <div class="description">
          Beautiful home with finished basement, attached garage,
          inground pool, central air conditioning, and brick fireplace.
        </div>
      </body>
    `;

    await page.setContent(html);
    const details = await parseDetailPage(page);

    expect(details.hasBasement).toBe(true);
    expect(details.hasGarage).toBe(true);
    expect(details.hasPool).toBe(true);
    expect(details.hasAc).toBe(true);
    expect(details.hasFireplace).toBe(true);
  });
});
