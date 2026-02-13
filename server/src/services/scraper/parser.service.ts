import type { Page } from 'playwright';

/**
 * Selectors for Realtor.ca. Update when the site changes.
 */
export const SELECTORS = {
  searchResults: {
    listingCard: '[class*="listingCard"], [data-testid*="listing"], article',
    price: '[class*="price"]',
    address: '[class*="address"]',
    beds: '[class*="beds"], [class*="bedroom"]',
    baths: '[class*="baths"], [class*="bathroom"]',
    sqft: '[class*="sqft"], [class*="area"]',
    detailLink: 'a[href*="/real-estate/"]',
    mlsNumber: '[class*="mls"], [class*="MLS"]',
    photo: 'img[class*="photo"], img[class*="image"]',
  },
  detailPage: {
    price: '[class*="price-amount"], [data-testid="price"]',
    address: '[class*="property-address"], [data-testid="address"]',
    mlsNumber: '[class*="mls-number"], [data-testid="mls"]',
    yearBuilt: '[class*="year-built"]',
    lotSize: '[class*="lot-size"]',
    livingArea: '[class*="living-area"]',
    bedrooms: '[class*="bedrooms"]',
    bathrooms: '[class*="bathrooms"]',
    stories: '[class*="stories"]',
    propertyType: '[class*="property-type"]',
    description: '[class*="description"], [data-testid="description"]',
    photos: '[class*="photo-gallery"] img, [class*="carousel"] img',
    brokerName: '[class*="agent-name"], [class*="realtor-name"]',
    brokerAgency: '[class*="agency-name"], [class*="brokerage"]',
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
  const cards = await page.locator(SELECTORS.searchResults.listingCard).all();

  for (const card of cards) {
    try {
      const link = card.locator(SELECTORS.searchResults.detailLink).first();
      const href = await link.getAttribute('href').catch(() => null);
      if (!href) continue;

      const detailUrl = href.startsWith('http')
        ? href
        : `https://www.realtor.ca${href}`;

      const priceText =
        (await card
          .locator(SELECTORS.searchResults.price)
          .first()
          .textContent()
          .catch(() => null)) ?? '';
      const price = parsePrice(priceText);
      if (!price) continue;

      const address =
        (await card
          .locator(SELECTORS.searchResults.address)
          .first()
          .textContent()
          .catch(() => null)) ?? '';

      const mlsText =
        (await card
          .locator(SELECTORS.searchResults.mlsNumber)
          .first()
          .textContent()
          .catch(() => null)) ?? '';
      const mlsMatch = mlsText.match(/\d{6,}/);
      const mlsNumber = mlsMatch ? mlsMatch[0] : detailUrl.split('/').pop() ?? '';

      if (!mlsNumber) continue;

      results.push({
        mlsNumber: mlsNumber.trim().slice(0, 50),
        detailUrl,
        address: (address || 'Unknown').trim().slice(0, 500),
        price,
      });
    } catch {
      // Skip malformed cards
    }
  }

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

  return out;
}
