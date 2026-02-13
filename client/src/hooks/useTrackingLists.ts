import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TrackingList } from 'shared/types/tracking-list';
import type { TrackingCriteria } from '@/types';

export function useTrackingLists() {
  return useQuery({
    queryKey: ['tracking-lists'],
    queryFn: () => api.get<TrackingList[]>('/tracking-lists'),
  });
}

export interface CreateTrackingListInput {
  name: string;
  description?: string;
  criteria?: TrackingCriteria;
  custom_url?: string;
}

export interface UpdateTrackingListInput {
  name?: string;
  description?: string;
  criteria?: TrackingCriteria;
  custom_url?: string;
}

export function useCreateTrackingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTrackingListInput) =>
      api.post<TrackingList>('/tracking-lists', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-lists'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTrackingList(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTrackingListInput) =>
      api.put<TrackingList>(`/tracking-lists/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-lists'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-lists', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTrackingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tracking-lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-lists'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
