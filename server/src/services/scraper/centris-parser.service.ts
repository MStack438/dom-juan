import type { Page } from 'playwright';

/**
 * Selectors for Centris.ca. Update when the site changes.
 *
 * Centris uses schema.org markup and has well-structured HTML.
 */
export const CENTRIS_SELECTORS = {
  searchResults: {
    // Main container for each listing
    listingCard: '.property-thumbnail-item',

    // Centris number (unique identifier) - in meta tag with itemprop="sku"
    centrisNumber: '[itemprop="sku"]',

    // Price - has both meta tag and display span
    price: '[itemprop="price"]', // meta tag has actual number
    priceDisplay: '.price span', // display text like "$1,200,000"

    // Detail page link
    detailLink: '.property-thumbnail-summary-link, .a-more-detail',

    // Address - in the address div
    address: '.address',

    // Category (property type) - e.g., "House for sale", "Condo for sale"
    category: '[itemprop="category"]',

    // Bedrooms - displayed as "cac" (chambres à coucher)
    bedrooms: '.cac',

    // Bathrooms - displayed as "sdb" (salles de bain)
    bathrooms: '.sdb',

    // Photo count
    photoCount: '.photo-btn',

    // Image
    photo: '[itemprop="image"]',
  },
  detailPage: {
    // TODO: Add detail page selectors when needed
    price: '[itemprop="price"]',
    address: '.address',
    centrisNumber: '[itemprop="sku"]',
    description: '[itemprop="description"]',
  },
} as const;

export interface CentrisSearchResult {
  centrisNumber: string;
  detailUrl: string;
  address: string;
  price: number;
  category?: string; // "House for sale", "Condo for sale", etc.
  bedrooms?: number;
  bathrooms?: number;
  photoCount?: number;
}

function parsePrice(text: string): number {
  // Handle formats like "$1,200,000" or "1200000"
  const match = text.replace(/\s/g, '').replace(/[^0-9]/g, '');
  return match ? parseInt(match, 10) : 0;
}

function parseInteger(text: string): number | undefined {
  const num = parseInt(text.trim(), 10);
  return isNaN(num) ? undefined : num;
}

export async function parseCentrisSearchResults(
  page: Page
): Promise<CentrisSearchResult[]> {
  const results: CentrisSearchResult[] = [];
  const cards = await page.locator(CENTRIS_SELECTORS.searchResults.listingCard).all();

  console.log(`[Centris Parser] Found ${cards.length} listing cards`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    try {
      // Extract Centris number from meta tag
      const centrisNumberEl = await card
        .locator(CENTRIS_SELECTORS.searchResults.centrisNumber)
        .first()
        .getAttribute('content')
        .catch(() => null);

      if (!centrisNumberEl) {
        console.warn(`[Centris Parser] Card ${i + 1}: No Centris number found`);
        failureCount++;
        continue;
      }

      // Extract detail link
      const link = card.locator(CENTRIS_SELECTORS.searchResults.detailLink).first();
      const href = await link.getAttribute('href').catch(() => null);

      if (!href) {
        console.warn(`[Centris Parser] Card ${i + 1}: No detail link found`);
        failureCount++;
        continue;
      }

      const detailUrl = href.startsWith('http')
        ? href
        : `https://www.centris.ca${href}`;

      // Extract price from meta tag (more reliable than display text)
      const priceContent = await card
        .locator(CENTRIS_SELECTORS.searchResults.price)
        .first()
        .getAttribute('content')
        .catch(() => null);

      const price = priceContent ? parseInt(priceContent, 10) : 0;

      if (!price) {
        console.warn(`[Centris Parser] Card ${i + 1}: No price found`);
        failureCount++;
        continue;
      }

      // Extract address
      const address = (
        await card
          .locator(CENTRIS_SELECTORS.searchResults.address)
          .first()
          .textContent()
          .catch(() => null)
      )?.trim() || '';

      // Extract category (property type)
      const category = (
        await card
          .locator(CENTRIS_SELECTORS.searchResults.category)
          .first()
          .textContent()
          .catch(() => null)
      )?.trim();

      // Extract bedrooms
      const bedroomsText = await card
        .locator(CENTRIS_SELECTORS.searchResults.bedrooms)
        .first()
        .textContent()
        .catch(() => null);
      const bedrooms = bedroomsText ? parseInteger(bedroomsText) : undefined;

      // Extract bathrooms
      const bathroomsText = await card
        .locator(CENTRIS_SELECTORS.searchResults.bathrooms)
        .first()
        .textContent()
        .catch(() => null);
      const bathrooms = bathroomsText ? parseInteger(bathroomsText) : undefined;

      // Extract photo count
      const photoCountText = await card
        .locator(CENTRIS_SELECTORS.searchResults.photoCount)
        .first()
        .textContent()
        .catch(() => null);
      const photoCount = photoCountText ? parseInteger(photoCountText) : undefined;

      results.push({
        centrisNumber: centrisNumberEl.trim(),
        detailUrl,
        address: address || 'Unknown',
        price,
        category,
        bedrooms,
        bathrooms,
        photoCount,
      });

      successCount++;

      // Log first successful parse for verification
      if (successCount === 1) {
        console.log('[Centris Parser] ✓ First listing parsed successfully:');
        console.log(`[Centris Parser]   Centris #: ${centrisNumberEl}`);
        console.log(`[Centris Parser]   Price: $${price.toLocaleString()}`);
        console.log(`[Centris Parser]   Address: ${address || 'Unknown'}`);
        console.log(`[Centris Parser]   Category: ${category || 'N/A'}`);
        console.log(`[Centris Parser]   Bedrooms: ${bedrooms || 'N/A'}`);
        console.log(`[Centris Parser]   Bathrooms: ${bathrooms || 'N/A'}`);
      }
    } catch (error) {
      console.warn(`[Centris Parser] Card ${i + 1}: Parse error:`, error);
      failureCount++;
    }
  }

  console.log(`[Centris Parser] Parse complete: ${successCount} success, ${failureCount} failed`);

  return results;
}

// TODO: Implement detail page parser when needed
export async function parseCentrisDetailPage(page: Page): Promise<any> {
  // Placeholder for detail page parsing
  return {};
}
