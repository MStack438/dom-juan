import type { TrackingCriteria } from '../../types/criteria.js';

/**
 * Build Centris.ca search URLs from tracking criteria
 *
 * Centris URL structure:
 * https://www.centris.ca/en/properties~for-sale~montreal-region?
 *   - Language: /en/ or /fr/
 *   - Transaction: properties, houses, condos, etc.
 *   - Region: montreal-region, quebec-city, etc.
 *   - Parameters: view=Thumbnail, filters, sorting
 */

const BASE_URL = 'https://www.centris.ca/en';

/**
 * Map property types to Centris categories
 */
function mapPropertyTypeToCategory(type: string): string {
  const mapping: Record<string, string> = {
    detached: 'houses',
    'semi_detached': 'houses',
    townhouse: 'houses',
    condo: 'condos',
    duplex: 'duplexes',
    triplex: 'triplexes',
    multi_family: 'multiplexes',
    land: 'lots',
    farm: 'farms',
  };

  return mapping[type] || 'properties';
}

/**
 * Map Quebec province/region to Centris region slug
 */
function mapRegionToSlug(municipality?: string): string {
  if (!municipality) return 'montreal-region';

  const lower = municipality.toLowerCase();

  // Montreal area
  if (lower.includes('montreal') || lower.includes('montréal')) {
    return 'montreal-region';
  }

  // Quebec City
  if (lower.includes('quebec') || lower.includes('québec')) {
    return 'quebec-city-area';
  }

  // Laval
  if (lower.includes('laval')) {
    return 'laval';
  }

  // Longueuil
  if (lower.includes('longueuil')) {
    return 'longueuil';
  }

  // Default to Montreal region
  return 'montreal-region';
}

/**
 * Build a Centris search URL from tracking criteria
 */
export function buildCentrisSearchUrl(criteria: TrackingCriteria): string {
  // Determine property category
  const category =
    criteria.propertyTypes && criteria.propertyTypes.length > 0
      ? mapPropertyTypeToCategory(criteria.propertyTypes[0])
      : 'properties';

  // Determine region (for now, just use a default - will be enhanced later)
  const region = null; // TODO: Look up municipality names from database

  // Start with base path
  let url = `${BASE_URL}/${category}~for-sale`;

  // Add region if not already generic
  if (region) {
    url += `~${region}`;
  }

  // Add query parameters
  const params = new URLSearchParams();

  // View mode (always use Thumbnail for consistency)
  params.set('view', 'Thumbnail');

  // Price range
  if (criteria.priceMin) {
    params.set('priceMin', criteria.priceMin.toString());
  }
  if (criteria.priceMax) {
    params.set('priceMax', criteria.priceMax.toString());
  }

  // Bedrooms
  if (criteria.bedroomsMin) {
    params.set('rooms', `${criteria.bedroomsMin}+`);
  }

  // Bathrooms
  if (criteria.bathroomsMin) {
    params.set('bathrooms', `${criteria.bathroomsMin}+`);
  }

  // Year built
  if (criteria.yearBuiltMin) {
    params.set('yearBuiltMin', criteria.yearBuiltMin.toString());
  }
  if (criteria.yearBuiltMax) {
    params.set('yearBuiltMax', criteria.yearBuiltMax.toString());
  }

  // Lot size (Centris uses square feet)
  if (criteria.lotSizeMinSqft) {
    params.set('lotSizeMin', criteria.lotSizeMinSqft.toString());
  }

  // Living area
  if (criteria.livingAreaMinSqft) {
    params.set('livingAreaMin', criteria.livingAreaMinSqft.toString());
  }

  // Sorting (default to most recent)
  params.set('sort', '-datePost'); // Newest first

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Build URL from a custom Centris.ca URL
 * Just validates and returns it
 */
export function buildFromCentrisCustomUrl(customUrl: string): string {
  // Validate it's a Centris URL
  if (!customUrl.includes('centris.ca')) {
    throw new Error('Invalid Centris URL');
  }

  // Ensure it has the view parameter
  if (!customUrl.includes('view=')) {
    const separator = customUrl.includes('?') ? '&' : '?';
    return `${customUrl}${separator}view=Thumbnail`;
  }

  return customUrl;
}

/**
 * Extract search parameters from a Centris URL for display/editing
 */
export function parseCentrisUrl(url: string): Partial<TrackingCriteria> {
  const criteria: Partial<TrackingCriteria> = {};

  try {
    const urlObj = new URL(url);

    // Extract price
    const priceMin = urlObj.searchParams.get('priceMin');
    const priceMax = urlObj.searchParams.get('priceMax');
    if (priceMin) criteria.priceMin = parseInt(priceMin, 10);
    if (priceMax) criteria.priceMax = parseInt(priceMax, 10);

    // Extract bedrooms
    const rooms = urlObj.searchParams.get('rooms');
    if (rooms) {
      const match = rooms.match(/^(\d+)/);
      if (match) criteria.bedroomsMin = parseInt(match[1], 10);
    }

    // Extract bathrooms
    const bathrooms = urlObj.searchParams.get('bathrooms');
    if (bathrooms) {
      const match = bathrooms.match(/^(\d+)/);
      if (match) criteria.bathroomsMin = parseInt(match[1], 10);
    }

    // Extract year built
    const yearBuiltMin = urlObj.searchParams.get('yearBuiltMin');
    const yearBuiltMax = urlObj.searchParams.get('yearBuiltMax');
    if (yearBuiltMin) criteria.yearBuiltMin = parseInt(yearBuiltMin, 10);
    if (yearBuiltMax) criteria.yearBuiltMax = parseInt(yearBuiltMax, 10);

    // Extract lot size
    const lotSizeMin = urlObj.searchParams.get('lotSizeMin');
    if (lotSizeMin) criteria.lotSizeMinSqft = parseInt(lotSizeMin, 10);

    // Extract living area
    const livingAreaMin = urlObj.searchParams.get('livingAreaMin');
    if (livingAreaMin) criteria.livingAreaMinSqft = parseInt(livingAreaMin, 10);
  } catch (error) {
    console.error('Error parsing Centris URL:', error);
  }

  return criteria;
}
