import { useDashboardActivity } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'destructive';
    case 'partial':
      return 'warning';
    case 'running':
      return 'default';
    default:
      return 'secondary';
  }
}

export function ActivityFeed() {
  const { data: activity, isLoading, error } = useDashboardActivity(15);

  if (error) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex gap-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16" />
              </li>
            ))}
          </ul>
        ) : !activity?.length ? (
          <p className="text-sm text-muted-foreground">
            No scrape runs yet. Trigger one from Settings.
          </p>
        ) : (
          <ul className="space-y-3">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {formatDate(item.timestamp)}
                </span>
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                <span className="w-full text-muted-foreground text-xs mt-0.5">
                  +{item.listingsNew ?? 0} new · {item.listingsUpdated ?? 0}{' '}
                  updated · {item.listingsDelisted ?? 0} delisted
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
