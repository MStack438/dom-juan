import type { Page } from 'playwright';

/**
 * Selectors for Realtor.ca. Update when the site changes.
 *
 * ⚠️ IMPORTANT: These are PLACEHOLDER selectors that need to be updated!
 *
 * To fix:
 * 1. Run: npm run capture-html (captures actual Realtor.ca HTML)
 * 2. Inspect fixtures/realtor-search-*.html in DevTools
 * 3. Update selectors below with actual data-* attributes and classes
 * 4. See SELECTOR-GUIDE.md for detailed instructions
 *
 * Each selector string can contain multiple fallbacks separated by commas.
 * The parser will try each selector in order until one matches.
 */
export const SELECTORS = {
  searchResults: {
    // Container for each listing card (one per property)
    // Updated for Realtor.ca list view (div.listingCard works perfectly)
    listingCard: [
      'div.listingCard',
      'li.cardCon',
      '[data-testid*="listing-card"]',
      '[data-testid*="listing"]',
      '[data-listing-id]',
      'article[class*="listing"]',
      'article[class*="card"]',
      '[class*="ListingCard"]',
      '[class*="PropertyCard"]',
      'article',
      '[role="article"]',
    ].join(', '),

    // Price within the card
    price: [
      '[data-testid*="price"]',
      '[data-price]',
      '[class*="Price"]',
      '[class*="price"]',
      '[itemprop="price"]',
    ].join(', '),

    // Address/location within the card
    address: [
      '[data-testid*="address"]',
      '[data-testid*="location"]',
      '[itemprop="address"]',
      '[class*="Address"]',
      '[class*="address"]',
      '[class*="Location"]',
      '[class*="location"]',
    ].join(', '),

    // Property specifications
    beds: [
      '[data-testid*="bed"]',
      '[class*="Bed"]',
      '[class*="bed"]',
      '[class*="bedroom"]',
    ].join(', '),

    baths: [
      '[data-testid*="bath"]',
      '[class*="Bath"]',
      '[class*="bath"]',
      '[class*="bathroom"]',
    ].join(', '),

    sqft: [
      '[data-testid*="sqft"]',
      '[data-testid*="area"]',
      '[class*="Sqft"]',
      '[class*="Area"]',
      '[class*="sqft"]',
      '[class*="area"]',
    ].join(', '),

    // Link to detail page
    detailLink: [
      'a[href*="/real-estate/"]',
      'a[href*="/property/"]',
      'a[href*="/listing/"]',
      'a[data-testid*="listing-link"]',
      'a[class*="listing"]',
    ].join(', '),

    // MLS number (unique identifier)
    mlsNumber: [
      '[data-mls-number]',
      '[data-listing-id]',
      '[data-testid*="mls"]',
      '[class*="MLS"]',
      '[class*="mls"]',
    ].join(', '),

    // Property photo
    photo: [
      'img[data-testid*="photo"]',
      'img[data-testid*="image"]',
      'img[class*="Photo"]',
      'img[class*="Image"]',
      'img[class*="photo"]',
      'img[class*="image"]',
    ].join(', '),
  },

  detailPage: {
    // Price on detail page
    price: [
      '[data-testid="price"]',
      '[data-testid*="price"]',
      '[itemprop="price"]',
      '[class*="Price"]',
      '[class*="price-amount"]',
      '[class*="price"]',
    ].join(', '),

    // Full address
    address: [
      '[data-testid="address"]',
      '[data-testid*="address"]',
      '[itemprop="address"]',
      'address',
      '[class*="Address"]',
      '[class*="property-address"]',
      '[class*="address"]',
    ].join(', '),

    // MLS number on detail page
    mlsNumber: [
      '[data-mls-number]',
      '[data-testid*="mls"]',
      '[class*="MLS"]',
      '[class*="mls-number"]',
      '[class*="mls"]',
    ].join(', '),

    // Property specifications
    yearBuilt: [
      '[data-testid*="year"]',
      '[class*="YearBuilt"]',
      '[class*="year-built"]',
      '[class*="year"]',
    ].join(', '),

    lotSize: [
      '[data-testid*="lot"]',
      '[class*="LotSize"]',
      '[class*="lot-size"]',
      '[class*="lot"]',
    ].join(', '),

    livingArea: [
      '[data-testid*="living"]',
      '[data-testid*="sqft"]',
      '[class*="LivingArea"]',
      '[class*="living-area"]',
      '[class*="square-feet"]',
    ].join(', '),

    bedrooms: [
      '[data-testid*="bed"]',
      '[class*="Bedroom"]',
      '[class*="bedroom"]',
      '[class*="bed"]',
    ].join(', '),

    bathrooms: [
      '[data-testid*="bath"]',
      '[class*="Bathroom"]',
      '[class*="bathroom"]',
      '[class*="bath"]',
    ].join(', '),

    stories: [
      '[data-testid*="stor"]',
      '[class*="Stories"]',
      '[class*="stories"]',
      '[class*="storey"]',
    ].join(', '),

    propertyType: [
      '[data-testid*="type"]',
      '[class*="PropertyType"]',
      '[class*="property-type"]',
      '[class*="type"]',
    ].join(', '),

    // Rich content
    description: [
      '[data-testid="description"]',
      '[data-testid*="description"]',
      '[itemprop="description"]',
      '[class*="Description"]',
      '[class*="description"]',
      '.description',
    ].join(', '),

    photos: [
      '[data-testid*="gallery"] img',
      '[data-testid*="photo"] img',
      '[class*="Gallery"] img',
      '[class*="Carousel"] img',
      '[class*="photo-gallery"] img',
      '[class*="carousel"] img',
      'img[src*="photo"]',
      'img[src*="image"]',
    ].join(', '),

    // Agent/broker information
    brokerName: [
      '[data-testid*="agent"]',
      '[data-testid*="broker"]',
      '[class*="AgentName"]',
      '[class*="agent-name"]',
      '[class*="realtor-name"]',
    ].join(', '),

    brokerAgency: [
      '[data-testid*="agency"]',
      '[data-testid*="brokerage"]',
      '[class*="Agency"]',
      '[class*="agency-name"]',
      '[class*="brokerage"]',
    ].join(', '),
  },
} as const;

export interface SearchResult {
  mlsNumber: string;
  detailUrl: string;
  address: string;
  price: number;
}

function parsePrice(text: string): number {
  const match = text.replace(/\s/g, '').replace(/[^0-9]/g, '');
  return match ? parseInt(match, 10) : 0;
}

export async function parseSearchResults(
  page: Page
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Try to find listing cards using the selector
  const cards = await page.locator(SELECTORS.searchResults.listingCard).all();

  // Diagnostic logging
  console.log(`[Parser] Found ${cards.length} listing cards using selector:`);
  console.log(`[Parser] ${SELECTORS.searchResults.listingCard.substring(0, 100)}...`);

  // If no cards found, log diagnostics
  if (cards.length === 0) {
    console.warn('[Parser] ⚠️  No listing cards found!');
    console.warn('[Parser] Possible reasons:');
    console.warn('[Parser]   1. Selectors are incorrect (most likely)');
    console.warn('[Parser]   2. Page not fully loaded');
    console.warn('[Parser]   3. Bot protection blocking content');

    // Try to detect what's on the page
    const bodyText = await page.locator('body').textContent();
    if (bodyText?.includes('Incapsula') || bodyText?.includes('Access Denied')) {
      console.error('[Parser] ❌ Bot protection detected on page');
    } else if (bodyText && bodyText.length < 1000) {
      console.warn('[Parser] ⚠️  Page content is suspiciously short');
    } else {
      console.warn('[Parser] ℹ️  Page has content, but selectors don\'t match');
      console.warn('[Parser] ℹ️  Run: npm run capture-html to debug');
    }

    return results;
  }

  // Parse each card
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    try {
      // Extract detail page link - try multiple strategies
      let href: string | null = null;

      // Strategy 1: Try specific selectors
      const specificLink = card.locator(SELECTORS.searchResults.detailLink).first();
      href = await specificLink.getAttribute('href').catch(() => null);

      // Strategy 2: If no specific link, try ANY link in the card
      if (!href) {
        const anyLinks = await card.locator('a[href]').all();
        for (const link of anyLinks) {
          const linkHref = await link.getAttribute('href').catch(() => null);
          // Accept any link that looks like a property detail page
          if (linkHref && (
            linkHref.includes('/real-estate/') ||
            linkHref.includes('/property') ||
            linkHref.includes('/listing') ||
            linkHref.includes('MLS') ||
            linkHref.includes('/map#') ||
            /\d{6,}/.test(linkHref) // Contains 6+ digit MLS-like number
          )) {
            href = linkHref;
            break;
          }
        }
      }

      // Strategy 3: Try getting link from the card itself if it's clickable
      if (!href) {
        href = await card.getAttribute('href').catch(() => null);
      }

      if (!href) {
        console.warn(`[Parser] Card ${i + 1}: No detail link found after trying all strategies`);
        failureCount++;
        continue;
      }

      const detailUrl = href.startsWith('http')
        ? href
        : `https://www.realtor.ca${href}`;

      // Extract price
      const priceText =
        (await card
          .locator(SELECTORS.searchResults.price)
          .first()
          .textContent()
          .catch(() => null)) ?? '';
      const price = parsePrice(priceText);
      if (!price) {
        console.warn(`[Parser] Card ${i + 1}: No price found (text: "${priceText}")`);
        failureCount++;
        continue;
      }

      // Extract address
      const address =
        (await card
          .locator(SELECTORS.searchResults.address)
          .first()
          .textContent()
          .catch(() => null)) ?? '';

      // Extract MLS number - try multiple strategies
      let mlsNumber = '';

      // Strategy 1: Try specific MLS selector
      const mlsText =
        (await card
          .locator(SELECTORS.searchResults.mlsNumber)
          .first()
          .textContent()
          .catch(() => null)) ?? '';
      const mlsMatch = mlsText.match(/\d{6,}/);
      if (mlsMatch) {
        mlsNumber = mlsMatch[0];
      }

      // Strategy 2: Extract from URL (last path segment or query param)
      if (!mlsNumber && href) {
        const urlMatch = href.match(/\d{6,}/);
        if (urlMatch) mlsNumber = urlMatch[0];
      }

      // Strategy 3: Search entire card text for MLS pattern
      if (!mlsNumber) {
        const cardText = await card.textContent().catch(() => '');
        const cardMatch = cardText?.match(/MLS[#\s:]*(\d{6,})/i);
        if (cardMatch) {
          mlsNumber = cardMatch[1];
        } else {
          // Just find any 6+ digit number as last resort
          const anyNumberMatch = cardText?.match(/\b(\d{6,})\b/);
          if (anyNumberMatch) mlsNumber = anyNumberMatch[1];
        }
      }

      // Strategy 4: Generate from URL if still no MLS
      if (!mlsNumber) {
        mlsNumber = detailUrl.split('/').pop()?.replace(/[^0-9]/g, '') ?? '';
      }

      // Strategy 5: Use a hash of the URL as absolute fallback
      if (!mlsNumber || mlsNumber.length < 6) {
        mlsNumber = `URL${Math.abs(detailUrl.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`;
      }

      results.push({
        mlsNumber: mlsNumber.trim().slice(0, 50),
        detailUrl,
        address: (address || 'Unknown').trim().slice(0, 500),
        price,
      });

      successCount++;

      // Log first successful parse for verification
      if (successCount === 1) {
        console.log('[Parser] ✓ First listing parsed successfully:');
        console.log(`[Parser]   MLS: ${mlsNumber}`);
        console.log(`[Parser]   Price: $${price.toLocaleString()}`);
        console.log(`[Parser]   Address: ${address || 'Unknown'}`);
      }
    } catch (error) {
      console.warn(`[Parser] Card ${i + 1}: Parse error:`, error);
      failureCount++;
    }
  }

  console.log(`[Parser] Parse complete: ${successCount} success, ${failureCount} failed`);

  return results;
}

export interface ParsedDetail {
  municipality?: string | null;
  postalCode?: string | null;
  yearBuilt?: number | null;
  lotSizeSqft?: number | null;
  lotDimensions?: string | null;
  livingAreaSqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  bathroomsHalf?: number | null;
  stories?: number | null;
  propertyType?:
    | 'detached'
    | 'semi_detached'
    | 'townhouse'
    | 'condo'
    | 'duplex'
    | 'triplex'
    | 'multi_family'
    | 'land'
    | 'farm'
    | 'other'
    | null;
  hasGarage?: boolean | null;
  garageSpaces?: number | null;
  hasBasement?: boolean | null;
  basementType?: 'full' | 'partial' | 'crawl' | 'none' | 'unknown' | null;
  basementFinished?: boolean | null;
  hasPool?: boolean | null;
  poolType?: 'inground' | 'above_ground' | 'none' | 'unknown' | null;
  hasAc?: boolean | null;
  hasFireplace?: boolean | null;
  heatingType?: string | null;
  waterSupply?: string | null;
  sewage?: string | null;
  descriptionText?: string | null;
  photoUrls?: string[];
  photoCount?: number;
  brokerName?: string | null;
  brokerAgency?: string | null;
  daysOnMarket?: number | null;
  originalListDate?: Date | null;
}

function parseInteger(text: string): number | null {
  const n = parseInt(text.replace(/\D/g, ''), 10);
  return isNaN(n) ? null : n;
}

function parseDecimal(text: string): number | null {
  const n = parseFloat(text.replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}

const PROPERTY_TYPE_KEYS = [
  'detached',
  'semi_detached',
  'townhouse',
  'condo',
  'duplex',
  'triplex',
  'multi_family',
  'land',
  'farm',
  'other',
] as const;

function normalizePropertyType(
  text: string
): ParsedDetail['propertyType'] | null {
  const lower = text.toLowerCase().replace(/\s/g, '_');
  for (const key of PROPERTY_TYPE_KEYS) {
    if (lower.includes(key)) return key;
  }
  return null;
}

export async function parseDetailPage(page: Page): Promise<ParsedDetail> {
  const out: ParsedDetail = {};

  const getText = async (selector: string): Promise<string> => {
    try {
      return (
        (await page.locator(selector).first().textContent())?.trim() ?? ''
      );
    } catch {
      return '';
    }
  };

  const address = await getText(SELECTORS.detailPage.address);
  const postalMatch = address.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i);
  out.postalCode = postalMatch ? postalMatch[0].toUpperCase() : null;
  const cityMatch = address.match(/,?\s*([A-Za-z\-]+(?:\s[A-Za-z\-]+)?)\s*,?\s*(?:QC|Quebec)/);
  out.municipality = cityMatch ? cityMatch[1].trim() : null;

  const yearText = await getText(SELECTORS.detailPage.yearBuilt);
  out.yearBuilt = parseInteger(yearText);

  const lotText = await getText(SELECTORS.detailPage.lotSize);
  out.lotSizeSqft = parseInteger(lotText);

  const livingText = await getText(SELECTORS.detailPage.livingArea);
  out.livingAreaSqft = parseInteger(livingText);

  const bedsText = await getText(SELECTORS.detailPage.bedrooms);
  out.bedrooms = parseInteger(bedsText);

  const bathsText = await getText(SELECTORS.detailPage.bathrooms);
  out.bathrooms = parseInteger(bathsText);

  const storiesText = await getText(SELECTORS.detailPage.stories);
  out.stories = parseDecimal(storiesText);

  const typeText = await getText(SELECTORS.detailPage.propertyType);
  out.propertyType = normalizePropertyType(typeText);

  out.descriptionText = await getText(SELECTORS.detailPage.description);
  if (!out.descriptionText) out.descriptionText = null;

  const photoEls = await page.locator(SELECTORS.detailPage.photos).all();
  const urls: string[] = [];
  for (const el of photoEls.slice(0, 50)) {
    const src = await el.getAttribute('src').catch(() => null);
    if (src) urls.push(src);
  }
  out.photoUrls = urls;
  out.photoCount = urls.length;

  out.brokerName = await getText(SELECTORS.detailPage.brokerName) || null;
  out.brokerAgency = await getText(SELECTORS.detailPage.brokerAgency) || null;

  const bodyText = await page.locator('body').textContent().catch(() => '');
  out.hasGarage = bodyText?.toLowerCase().includes('garage') ?? null;
  out.hasBasement = bodyText?.toLowerCase().includes('basement') ?? null;
  out.hasPool = bodyText?.toLowerCase().includes('pool') ?? null;
  out.hasAc =
    bodyText?.toLowerCase().includes('air conditioning') ||
    bodyText?.toLowerCase().includes('central air')
      ? true
      : null;
  out.hasFireplace = bodyText?.toLowerCase().includes('fireplace') ?? null;

  // Extract "Time on REALTOR.ca" field
  // Format: "Time on REALTOR.ca: 1 hour" or "5 days" or "2 weeks" or "1 month"
  const timeOnRealtorMatch = bodyText?.match(/Time on REALTOR\.ca[:\s]+(\d+)\s+(hour|day|week|month)s?/i);
  if (timeOnRealtorMatch) {
    const value = parseInt(timeOnRealtorMatch[1], 10);
    const unit = timeOnRealtorMatch[2].toLowerCase();

    let daysOnMarket = 0;
    switch (unit) {
      case 'hour':
        daysOnMarket = Math.max(0, Math.floor(value / 24)); // Convert hours to days
        break;
      case 'day':
        daysOnMarket = value;
        break;
      case 'week':
        daysOnMarket = value * 7;
        break;
      case 'month':
        daysOnMarket = value * 30; // Approximate
        break;
    }

    if (!isNaN(daysOnMarket)) {
      out.daysOnMarket = daysOnMarket;
      // Calculate original list date by subtracting days from now
      const now = new Date();
      const originalDate = new Date(now);
      originalDate.setDate(originalDate.getDate() - daysOnMarket);
      out.originalListDate = originalDate;
    }
  }

  return out;
}
