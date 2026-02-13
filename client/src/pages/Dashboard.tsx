import { useTrackingLists } from '@/hooks/useTrackingLists';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { TrackingListCard } from '@/components/dashboard/TrackingListCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const { data: lists, isLoading, error } = useTrackingLists();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/tracking-lists/new">
            <Button size="sm">New tracking list</Button>
          </Link>
          <Link to="/settings">
            <Button variant="outline" size="sm">Settings</Button>
          </Link>
        </div>
      </div>

      <QuickStats />

      <section>
        <h2 className="text-lg font-medium mb-4">Tracking lists</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-destructive">
            Failed to load tracking lists. Please try again.
          </p>
        ) : lists && lists.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <TrackingListCard
                key={list.id}
                list={list}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No tracking lists yet.</p>
              <p className="text-sm mt-2">
                Create one via the API or add a flow in a later phase.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="max-w-md">
        <ActivityFeed />
      </section>
    </div>
  );
}
