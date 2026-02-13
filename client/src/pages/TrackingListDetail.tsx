import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTrackingList } from '@/hooks/useTrackingList';
import {
  useListingsByTrackingList,
  type ListingsFilters,
} from '@/hooks/useListings';
import { ListingTable } from '@/components/tracking-list/ListingTable';
import { ListingFilters } from '@/components/tracking-list/ListingFilters';
import { TrendChart } from '@/components/tracking-list/TrendChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const defaultFilters: ListingsFilters = {
  status: 'active',
  sort: 'dom',
  order: 'desc',
};

function useExportTrackingListCsv(id: string | undefined) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function exportCsv() {
    if (!id) return;
    setError(null);
    setExporting(true);
    try {
      await api.download(`export/tracking-list/${id}`, 'tracking-list.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }
  return { exportCsv, exporting, error };
}

export function TrackingListDetail() {
  const { id } = useParams<{ id: string }>();
  const [filters, setFilters] = useState<ListingsFilters>(defaultFilters);
  const { exportCsv, exporting, error: exportError } = useExportTrackingListCsv(id);
  const { data: list, isLoading: listLoading, error: listError } = useTrackingList(id);
  const { data: listings, isLoading: listingsLoading } = useListingsByTrackingList(
    id,
    filters
  );

  if (listLoading || listError) {
    return (
      <div className="space-y-4">
        {listLoading && <p className="text-muted-foreground">Loading…</p>}
        {listError && (
          <p className="text-destructive">Failed to load tracking list.</p>
        )}
      </div>
    );
  }

  if (!list) {
    return (
      <div>
        <p className="text-muted-foreground">Tracking list not found.</p>
        <Link to="/">
          <Button variant="link" className="mt-2">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{list.name}</h1>
          {list.description && (
            <p className="text-muted-foreground mt-1">{list.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Link to={`/tracking-lists/${id}/edit`}>
            <Button variant="outline" size="sm">Edit list</Button>
          </Link>
        </div>
      </div>
      {exportError && (
        <p className="text-sm text-destructive">{exportError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Listings</CardTitle>
              <p className="text-sm text-muted-foreground">
                {list.activeCount ?? list.listingCount ?? 0} active ·{' '}
                {list.listingCount ?? 0} total
              </p>
              <ListingFilters filters={filters} onFiltersChange={setFilters} />
            </CardHeader>
            <CardContent>
              <ListingTable
                listings={listings ?? []}
                isLoading={listingsLoading}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <TrendChart listings={listings ?? []} />
        </div>
      </div>
    </div>
  );
}
