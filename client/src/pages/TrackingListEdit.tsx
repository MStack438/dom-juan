import { useParams, Link, useNavigate } from 'react-router-dom';
import { TrackingListForm } from '@/components/tracking-list/TrackingListForm';
import { useTrackingList } from '@/hooks/useTrackingList';
import { useUpdateTrackingList } from '@/hooks/useTrackingLists';
import { Button } from '@/components/ui/button';

export function TrackingListEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list, isLoading, error } = useTrackingList(id);
  const update = useUpdateTrackingList(id);

  async function handleSubmit(data: {
    name: string;
    description?: string;
    criteria?: import('@/types').TrackingCriteria;
    custom_url?: string;
  }) {
    await update.mutateAsync(data);
    navigate(`/tracking-lists/${id}`, { replace: true });
  }

  if (isLoading || error) {
    return (
      <div>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">Failed to load list.</p>}
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          to={`/tracking-lists/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to list
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit tracking list</h1>
      </div>
      <TrackingListForm
        mode="edit"
        initial={list}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
