import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ScraperStatus } from '@/types';

export function useScraperStatus() {
  return useQuery({
    queryKey: ['scraper', 'status'],
    queryFn: () => api.get<ScraperStatus>('/scraper/status'),
    refetchInterval: 5000,
  });
}

export function useTriggerScrape() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ id: string }>('/scraper/run'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraper'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-lists'] });
    },
  });
}
