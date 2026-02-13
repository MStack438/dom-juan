import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Listing, Snapshot } from '@/types';

export interface ListingsFilters {
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  priceMin?: number;
  priceMax?: number;
}

export function useListingsByTrackingList(
  trackingListId: string | undefined,
  options?: ListingsFilters
) {
  const {
    status = 'active',
    sort = 'dom',
    order = 'desc',
    priceMin,
    priceMax,
  } = options ?? {};
  const params = new URLSearchParams({ status, sort, order });
  if (priceMin != null) params.set('priceMin', String(priceMin));
  if (priceMax != null) params.set('priceMax', String(priceMax));
  return useQuery({
    queryKey: [
      'tracking-lists',
      trackingListId,
      'listings',
      status,
      sort,
      order,
      priceMin,
      priceMax,
    ],
    queryFn: () =>
      api.get<Listing[]>(
        `/tracking-lists/${trackingListId}/listings?${params.toString()}`
      ),
    enabled: Boolean(trackingListId),
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: () => api.get<Listing>(`/listings/${id}`),
    enabled: Boolean(id),
  });
}

export function useListingSnapshots(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listings', listingId, 'snapshots'],
    queryFn: () => api.get<Snapshot[]>(`/listings/${listingId}/snapshots`),
    enabled: Boolean(listingId),
  });
}
