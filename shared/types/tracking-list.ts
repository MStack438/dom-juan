import type { TrackingCriteria } from './criteria';

export interface TrackingList {
  id: string;
  name: string;
  description: string | null;
  criteria: TrackingCriteria;
  customUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingListWithStats extends TrackingList {
  listingCount?: number;
  activeCount?: number;
}
