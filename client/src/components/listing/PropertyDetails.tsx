import { formatPrice } from '@/lib/utils';
import type { Listing } from '@/types';

interface PropertyDetailsProps {
  listing: Listing;
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function PropertyDetails({ listing }: PropertyDetailsProps) {
  return (
    <div className="space-y-2">
      <Row label="Address" value={listing.address} />
      <Row label="Municipality" value={listing.municipality} />
      <Row label="Postal code" value={listing.postalCode} />
      <Row label="Current price" value={listing.currentPrice != null ? formatPrice(listing.currentPrice) : undefined} />
      <Row label="Original price" value={listing.originalPrice != null ? formatPrice(listing.originalPrice) : undefined} />
      <Row label="Price changes" value={listing.priceChangeCount} />
      <Row label="Status" value={listing.status} />
      <Row label="Property type" value={listing.propertyType} />
      <Row label="Bedrooms" value={listing.bedrooms} />
      <Row label="Bathrooms" value={listing.bathrooms} />
      <Row label="Living area" value={listing.livingAreaSqft != null ? `${listing.livingAreaSqft} sq ft` : undefined} />
      <Row label="Lot size" value={listing.lotSizeSqft != null ? `${listing.lotSizeSqft} sq ft` : undefined} />
      <Row label="Year built" value={listing.yearBuilt} />
      <Row label="Stories" value={listing.stories != null ? String(listing.stories) : undefined} />
      <Row label="Garage" value={listing.hasGarage != null ? (listing.hasGarage ? 'Yes' : 'No') : undefined} />
      <Row label="Garage spaces" value={listing.garageSpaces} />
      <Row label="Basement" value={listing.hasBasement != null ? (listing.hasBasement ? 'Yes' : 'No') : undefined} />
      <Row label="Pool" value={listing.hasPool != null ? (listing.hasPool ? 'Yes' : 'No') : undefined} />
      <Row label="AC" value={listing.hasAc != null ? (listing.hasAc ? 'Yes' : 'No') : undefined} />
      <Row label="Fireplace" value={listing.hasFireplace != null ? (listing.hasFireplace ? 'Yes' : 'No') : undefined} />
      <Row label="Heating" value={listing.heatingType} />
      <Row label="Broker" value={listing.brokerName} />
      <Row label="Agency" value={listing.brokerAgency} />
      {listing.descriptionText && (
        <div className="pt-2 mt-2 border-t border-border">
          <p className="text-sm text-muted-foreground mb-1">Description</p>
          <p className="text-sm whitespace-pre-wrap">{listing.descriptionText}</p>
        </div>
      )}
    </div>
  );
}
