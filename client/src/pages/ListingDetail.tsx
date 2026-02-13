import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useListing } from '@/hooks/useListings';
import { useListingSnapshots } from '@/hooks/useListings';
import { PriceHistoryChart } from '@/components/listing/PriceHistoryChart';
import { PropertyDetails } from '@/components/listing/PropertyDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { data: listing, isLoading, error } = useListing(id);
  const { data: snapshots } = useListingSnapshots(id);

  async function handleExportHistory() {
    if (!id) return;
    setExportError(null);
    setExporting(true);
    try {
      await api.download(`export/snapshots/${id}`, `snapshots-${listing?.mlsNumber ?? id}.csv`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  if (isLoading || error) {
    return (
      <div className="space-y-4">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">Failed to load listing.</p>}
      </div>
    );
  }

  if (!listing) {
    return (
      <div>
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/">
          <Button variant="link" className="mt-2">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <h1 className="text-2xl font-semibold">{listing.address}</h1>
          <Badge variant={listing.status === 'active' ? 'success' : 'secondary'}>
            {listing.status}
          </Badge>
          <span className="text-muted-foreground text-sm">
            MLS® {listing.mlsNumber}
          </span>
        </div>
        {listing.municipality && (
          <p className="text-muted-foreground mt-1">{listing.municipality}</p>
        )}
        <p className="text-2xl font-bold mt-2">
          {formatPrice(listing.currentPrice)}
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          {listing.sourceUrl && (
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on Realtor.ca →
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportHistory}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Export history CSV'}
          </Button>
        </div>
        {exportError && (
          <p className="text-sm text-destructive mt-1">{exportError}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price history</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceHistoryChart snapshots={snapshots ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyDetails listing={listing} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
