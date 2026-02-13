import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TrackingListWithStats } from '@/types';

export function useTrackingList(id: string | undefined) {
  return useQuery({
    queryKey: ['tracking-lists', id],
    queryFn: () => api.get<TrackingListWithStats>(`/tracking-lists/${id}`),
    enabled: Boolean(id),
  });
}
