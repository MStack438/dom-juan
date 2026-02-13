import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardSummary, ActivityItem } from '@/types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });
}

export function useDashboardActivity(limit = 20) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: () =>
      api.get<ActivityItem[]>(`/dashboard/activity?limit=${limit}`),
  });
}
