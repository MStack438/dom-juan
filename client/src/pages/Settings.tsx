import { Link } from 'react-router-dom';
import { useScraperStatus, useTriggerScrape } from '@/hooks/useScraper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export function Settings() {
  const { data: status, isLoading } = useScraperStatus();
  const triggerScrape = useTriggerScrape();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scraper</CardTitle>
          <p className="text-sm text-muted-foreground">
            Trigger a manual scrape or check status.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <Badge variant={status?.running ? 'default' : 'secondary'}>
                  {status?.running ? 'Running' : 'Idle'}
                </Badge>
              </div>
              {status?.lastRun && typeof status.lastRun === 'object' && 'startedAt' in status.lastRun && (
                <p className="text-sm text-muted-foreground">
                  Last run: {formatDate(String((status.lastRun as { startedAt?: string }).startedAt))}{' '}
                  ({(status.lastRun as { status?: string }).status ?? '—'})
                </p>
              )}
              <Button
                onClick={() => triggerScrape.mutate()}
                disabled={status?.running || triggerScrape.isPending}
              >
                {triggerScrape.isPending
                  ? 'Starting…'
                  : status?.running
                    ? 'Scrape in progress'
                    : 'Run scrape now'}
              </Button>
              {triggerScrape.isError && (
                <p className="text-sm text-destructive">
                  {triggerScrape.error?.message ?? 'Failed to start scrape'}
                </p>
              )}
              {triggerScrape.isSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Scrape started.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
