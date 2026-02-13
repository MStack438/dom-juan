import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TrackingListWithStats } from '@/types';

interface TrackingListCardProps {
  list: TrackingListWithStats;
}

export function TrackingListCard({ list }: TrackingListCardProps) {
  const count = list.activeCount ?? list.listingCount ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{list.name}</CardTitle>
          <Badge variant={list.isActive ? 'success' : 'secondary'}>
            {list.isActive ? 'Active' : 'Paused'}
          </Badge>
        </div>
        {list.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {list.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {count} listing{count !== 1 ? 's' : ''}
        </span>
        <Link to={`/tracking-lists/${list.id}`}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
