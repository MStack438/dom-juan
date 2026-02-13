export interface ScrapeError {
  timestamp: string;
  severity: 'warning' | 'error' | 'critical';
  category: 'network' | 'parse' | 'rate_limit' | 'blocked' | 'database' | 'unknown';
  message: string;
  context: {
    url?: string;
    mlsNumber?: string;
    trackingListId?: string;
    httpStatus?: number;
    selector?: string;
  };
  stack?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
