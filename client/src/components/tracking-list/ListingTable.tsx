import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import type { Listing } from '@/types';

interface ListingTableProps {
  listings: Listing[];
  isLoading?: boolean;
}

function daysOnMarket(listing: Listing): number {
  const first = new Date(listing.firstSeenAt).getTime();
  const last = new Date(listing.lastSeenAt).getTime();
  return Math.max(0, Math.floor((last - first) / (24 * 60 * 60 * 1000)));
}

export function ListingTable({ listings, isLoading }: ListingTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>DOM</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell colSpan={5} className="h-12 animate-pulse bg-muted/50" />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No listings in this list yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>DOM</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing.id}>
              <TableCell className="font-medium">
                {listing.address}
                {listing.municipality && (
                  <span className="block text-xs text-muted-foreground">
                    {listing.municipality}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {formatPrice(listing.currentPrice)}
                {listing.priceChangeCount > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({listing.priceChangeCount} change
                    {listing.priceChangeCount !== 1 ? 's' : ''})
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    listing.status === 'active'
                      ? 'success'
                      : listing.status === 'delisted'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {listing.status}
                </Badge>
              </TableCell>
              <TableCell>{daysOnMarket(listing)} days</TableCell>
              <TableCell>
                <Link to={`/listings/${listing.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
