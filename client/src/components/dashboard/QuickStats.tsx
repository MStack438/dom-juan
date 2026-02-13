import { useDashboardSummary } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export function QuickStats() {
  const { data: summary, isLoading, error } = useDashboardSummary();

  if (error) return null;
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const lastRun = summary.lastScrapeRun;
  const lastRunLabel = lastRun
    ? formatDate(lastRun.startedAt)
    : 'No scrape yet';

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Active lists
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{summary.activeTrackingLists}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Active listings
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{summary.activeListings}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Last scrape
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{lastRunLabel}</p>
          {lastRun && (
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {lastRun.status}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
