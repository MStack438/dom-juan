import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Listing } from '@/types';

interface TrendChartProps {
  listings: Listing[];
}

function daysOnMarket(listing: Listing): number {
  const first = new Date(listing.firstSeenAt).getTime();
  const last = new Date(listing.lastSeenAt).getTime();
  return Math.max(0, Math.floor((last - first) / (24 * 60 * 60 * 1000)));
}

export function TrendChart({ listings }: TrendChartProps) {
  const active = listings.filter((l) => l.status === 'active');
  const withPriceDrop = active.filter(
    (l) => l.originalPrice > 0 && l.currentPrice < l.originalPrice
  );
  const avgDom =
    active.length > 0
      ? Math.round(
          active.reduce((sum, l) => sum + daysOnMarket(l), 0) / active.length
        )
      : null;
  const avgPriceDropPct =
    withPriceDrop.length > 0
      ? (
          withPriceDrop.reduce((sum, l) => {
            const pct =
              (1 - l.currentPrice / l.originalPrice) * 100;
            return sum + pct;
          }, 0) / withPriceDrop.length
        ).toFixed(1)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          From {active.length} active listing{active.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Avg. days on market</p>
          <p className="text-2xl font-bold">
            {avgDom != null ? `${avgDom} days` : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avg. price drop</p>
          <p className="text-2xl font-bold">
            {avgPriceDropPct != null ? `${avgPriceDropPct}%` : '—'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
