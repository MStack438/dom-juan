import type { TrackingCriteria } from '../../types/criteria.js';

// Use list view instead of map view for better DOM scraping
const REALTOR_BASE = 'https://www.realtor.ca/qc/greater-montreal/real-estate';

const PROPERTY_TYPE_MAP: Record<string, string> = {
  detached: '1',
  semi_detached: '2',
  townhouse: '3',
  condo: '9',
  duplex: '4',
  triplex: '5',
  multi_family: '6',
  land: '0',
  farm: '8',
  other: '1',
};

export function buildSearchUrl(criteria: TrackingCriteria): string {
  const params = new URLSearchParams();

  params.set('TransactionTypeId', '2');

  if (criteria.priceMin)
    params.set('PriceMin', criteria.priceMin.toString());
  if (criteria.priceMax)
    params.set('PriceMax', criteria.priceMax.toString());

  if (criteria.bedroomsMin)
    params.set('BedRange', `${criteria.bedroomsMin}-0`);
  if (criteria.bedroomsMax)
    params.set(
      'BedRange',
      `${criteria.bedroomsMin ?? 0}-${criteria.bedroomsMax}`
    );

  if (criteria.bathroomsMin)
    params.set('BathRange', `${criteria.bathroomsMin}-0`);

  if (criteria.propertyTypes?.length) {
    const typeIds = criteria.propertyTypes
      .map((t) => PROPERTY_TYPE_MAP[t])
      .filter(Boolean)
      .join(',');
    if (typeIds) params.set('PropertyTypeGroupID', typeIds);
  }

  if (criteria.yearBuiltMin)
    params.set('BuildingAgeMin', criteria.yearBuiltMin.toString());
  if (criteria.yearBuiltMax)
    params.set('BuildingAgeMax', criteria.yearBuiltMax.toString());

  params.set('Sort', '1-D');
  params.set('RecordsPerPage', '50');

  return `${REALTOR_BASE}?${params.toString()}`;
}

export function buildFromCustomUrl(customUrl: string): string {
  if (!customUrl.startsWith('https://www.realtor.ca')) {
    throw new Error('Custom URL must be from realtor.ca');
  }
  return customUrl;
}
