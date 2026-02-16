export type ListingStatus =
  | 'active'
  | 'delisted'
  | 'sold'
  | 'expired'
  | 'unknown';

export type PropertyType =
  | 'detached'
  | 'semi_detached'
  | 'townhouse'
  | 'condo'
  | 'duplex'
  | 'triplex'
  | 'multi_family'
  | 'land'
  | 'farm'
  | 'other';

export type BasementType = 'full' | 'partial' | 'crawl' | 'none' | 'unknown';
export type PoolType = 'inground' | 'above_ground' | 'none' | 'unknown';

export interface Listing {
  id: string;
  mlsNumber: string;
  sourceUrl: string;
  regionId: string | null;
  address: string;
  municipality: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  lastDetailScrapeAt: string | null;
  delistedAt: string | null;
  originalListDate: string | null;
  listedDaysWhenFound: number | null;
  originalPrice: number;
  currentPrice: number;
  priceChangeCount: number;
  status: ListingStatus;
  propertyType: PropertyType | null;
  yearBuilt: number | null;
  lotSizeSqft: number | null;
  lotDimensions: string | null;
  livingAreaSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bathroomsHalf: number | null;
  stories: number | null;
  hasGarage: boolean | null;
  garageSpaces: number | null;
  hasBasement: boolean | null;
  basementType: BasementType | null;
  basementFinished: boolean | null;
  hasPool: boolean | null;
  poolType: PoolType | null;
  hasAc: boolean | null;
  hasFireplace: boolean | null;
  heatingType: string | null;
  waterSupply: string | null;
  sewage: string | null;
  descriptionText: string | null;
  photoUrls: string[];
  photoCount: number;
  brokerName: string | null;
  brokerAgency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  listingId: string;
  capturedAt: string;
  price: number;
  status: ListingStatus;
  photoCount: number | null;
  isFeatured: boolean | null;
  createdAt: string;
}
