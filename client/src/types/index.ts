export type { TrackingList, TrackingListWithStats } from 'shared/types/tracking-list';
export type { TrackingCriteria, PropertyType } from 'shared/types/criteria';
export type { Listing, Snapshot, ListingStatus } from 'shared/types/listing';

export interface DashboardSummary {
  activeTrackingLists: number;
  activeListings: number;
  lastScrapeRun: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
  } | null;
}

export interface ActivityItem {
  type: 'scrape_run';
  id: string;
  timestamp: string;
  status: string;
  listingsNew: number | null;
  listingsUpdated: number | null;
  listingsDelisted: number | null;
}

export interface ScraperStatus {
  running: boolean;
  currentRun?: unknown;
  lastRun?: unknown;
}
