import { Link, useNavigate } from 'react-router-dom';
import { TrackingListForm } from '@/components/tracking-list/TrackingListForm';
import { useCreateTrackingList } from '@/hooks/useTrackingLists';

export function TrackingListNew() {
  const navigate = useNavigate();
  const create = useCreateTrackingList();

  async function handleSubmit(data: {
    name: string;
    description?: string;
    criteria?: import('@/types').TrackingCriteria;
    custom_url?: string;
  }) {
    await create.mutateAsync(data);
    navigate('/', { replace: true });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-1">New tracking list</h1>
      </div>
      <TrackingListForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
