import * as listingService from '../listing/listing.service.js';

function escapeCsvField(value: string | number | Date | null | undefined): string {
  let s: string;
  if (value === null || value === undefined) {
    s = '';
  } else if (value instanceof Date) {
    s = value.toISOString();
  } else {
    s = String(value);
  }
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values: (string | number | Date | null | undefined)[]): string {
  return values.map(escapeCsvField).join(',');
}

export async function getTrackingListCsv(trackingListId: string): Promise<string> {
  const listings = await listingService.getListingsByTrackingList(
    trackingListId,
    { status: 'all', sort: 'date', order: 'desc' }
  );

  const header = csvRow([
    'MLS Number',
    'Address',
    'Municipality',
    'Postal Code',
    'Current Price',
    'Original Price',
    'Price Changes',
    'Status',
    'Property Type',
    'Bedrooms',
    'Bathrooms',
    'Living Area (sq ft)',
    'Lot Size (sq ft)',
    'Year Built',
    'First Seen',
    'Last Seen',
    'Days on Market',
    'Source URL',
  ]);

  const rows = listings.map((l) => {
    const first = l.firstSeenAt ? new Date(l.firstSeenAt).getTime() : 0;
    const last = l.lastSeenAt ? new Date(l.lastSeenAt).getTime() : 0;
    const dom = Math.max(0, Math.floor((last - first) / (24 * 60 * 60 * 1000)));
    const firstSeen = l.firstSeenAt instanceof Date ? l.firstSeenAt : l.firstSeenAt ? new Date(l.firstSeenAt) : null;
    const lastSeen = l.lastSeenAt instanceof Date ? l.lastSeenAt : l.lastSeenAt ? new Date(l.lastSeenAt) : null;
    return csvRow([
      l.mlsNumber,
      l.address,
      l.municipality ?? '',
      l.postalCode ?? '',
      l.currentPrice,
      l.originalPrice,
      l.priceChangeCount,
      l.status,
      l.propertyType ?? '',
      l.bedrooms ?? '',
      l.bathrooms ?? '',
      l.livingAreaSqft ?? '',
      l.lotSizeSqft ?? '',
      l.yearBuilt ?? '',
      firstSeen ?? '',
      lastSeen ?? '',
      dom,
      l.sourceUrl ?? '',
    ]);
  });

  return [header, ...rows].join('\r\n');
}

export async function getSnapshotsCsv(listingId: string): Promise<string> {
  const snapshots = await listingService.getSnapshotsByListingId(listingId);

  const header = csvRow(['Date', 'Price', 'Status']);

  const rows = snapshots.map((s) => {
    const captured = s.capturedAt instanceof Date ? s.capturedAt : s.capturedAt ? new Date(s.capturedAt) : '';
    return csvRow([captured, s.price, s.status]);
  });

  return [header, ...rows].join('\r\n');
}
