# AGENTS.md — DOM Juan Project Context

## Project Overview

DOM Juan is a personal real estate intelligence platform for tracking Quebec property listings. It passively monitors the market, tracking properties from listing to delisting, and builds a historical database for market insights.

**Owner:** Marie-Jo Hérard (project finance professional based in Quebec)

**Core Use Case:** Track detached houses in specific price ranges across Quebec regions, accumulating data over months/years to identify market patterns — what sells fast, price movements, seasonal trends.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Scraper:** Playwright (headless Chromium)
- **Deployment:** Railway

## Project Structure

```
dom-juan/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Dashboard, ListingDetail, TrackingList views
│       ├── components/     # Reusable UI components
│       └── hooks/          # React hooks for data fetching
├── server/                 # Express backend
│   └── src/
│       ├── db/
│       │   ├── schema/     # Drizzle ORM schema definitions
│       │   └── migrations/ # Database migrations
│       ├── routes/         # API endpoints
│       └── services/
│           ├── scraper/    # ⚠️ CRITICAL: Realtor.ca scraping logic
│           ├── listing/    # Listing CRUD operations
│           ├── tracking-list/
│           ├── dashboard/
│           └── export/     # CSV export functionality
└── shared/                 # Shared types between client/server
```

## Key Files for Scraper Work

| File | Purpose |
|------|---------|
| `server/src/services/scraper/parser.service.ts` | **DOM selectors live here** — this is where Realtor.ca HTML is parsed |
| `server/src/services/scraper/scraper.service.ts` | Orchestrates scraping: browser launch, pagination, error handling |
| `server/src/services/scraper/url-builder.service.ts` | Constructs Realtor.ca search URLs from tracking list criteria |
| `server/src/services/scraper/scheduler.service.ts` | Cron scheduling for daily scrapes |

## Database Schema (Key Tables)

### `tracking_list`
User-defined search criteria. Each tracking list generates a Realtor.ca search URL.
- `id`, `name`, `criteria` (JSON), `custom_url`, `is_active`

### `listing`
Individual properties discovered by the scraper.
- `mls_number` (unique identifier)
- `address`, `municipality`, `postal_code`
- `original_price`, `current_price`, `price_change_count`
- `status` ('active' | 'delisted')
- `first_seen_at`, `last_seen_at`, `delisted_at`
- Property details: `bedrooms`, `bathrooms`, `year_built`, `lot_size_sqft`, `living_area_sqft`
- Features: `has_garage`, `has_basement`, `has_pool`, `has_ac`, `has_fireplace`

### `snapshot`
Price/status history for each listing (one row per scrape where listing is seen).
- `listing_id`, `price`, `status`, `scraped_at`

### `listing_tracking_list`
Many-to-many join: which listings belong to which tracking lists.

### `scrape_run`
Audit log of each scrape execution.
- `status`, `started_at`, `completed_at`
- `listings_found`, `listings_new`, `listings_updated`, `listings_delisted`
- `errors` (JSON array)

## Current State & Known Issues

### What Works
- ✅ Full frontend with Dashboard, Tracking List management, Listing Detail views
- ✅ Backend API for all CRUD operations
- ✅ Database schema and migrations
- ✅ Scraper infrastructure (browser management, rate limiting, circuit breaker)
- ✅ CSV export for tracking lists and listing history
- ✅ Scheduled scraping (configurable hour, America/Toronto timezone)
- ✅ Healthcheck.io integration for monitoring

### What's Broken
- ❌ **Scraper selectors don't match Realtor.ca's actual DOM**
  - The selectors in `parser.service.ts` are placeholder guesses
  - Scraper runs successfully but returns zero listings
  - This is the #1 priority to fix

### What's Not Yet Built
- Centris.ca support (Quebec's MLS, has more listings than Realtor.ca for Quebec)
- DuProprio support (For Sale By Owner listings)
- Map visualization
- Email/notification alerts for new listings or price drops

## Coding Standards

- **TypeScript:** Strict mode enabled. All code must be properly typed.
- **Imports:** Use `.js` extensions for local imports (ESM requirement)
- **Error Handling:** Use try/catch, log errors, never crash the process
- **Database:** Use Drizzle ORM query builder, not raw SQL
- **Async:** All I/O operations are async/await
- **Comments:** Minimal — code should be self-documenting

## Testing the Scraper

After modifying selectors, test with:

```bash
cd server
npm run scrape
```

Or via API (requires auth):
```bash
curl -X POST http://localhost:5000/api/scraper/run \
  -H "Cookie: session=<your-session-cookie>"
```

Check results:
- `scrape_run` table should show `status: 'completed'` with `listings_found > 0`
- `listing` table should have new rows
- Dashboard should display the new listings

## Important Notes for Agents

1. **Realtor.ca changes frequently** — their DOM structure and class names may change without notice. Build selectors that are resilient (multiple fallback selectors, data attributes over class names when available).

2. **Rate limiting is critical** — the scraper has delays built in. Do not remove them. Realtor.ca will block aggressive scrapers.

3. **Quebec-specific** — This tool only targets Quebec properties. Realtor.ca URLs should include `Province=QC` or similar filters.

4. **Privacy** — This is a personal tool. No user accounts beyond the owner. Single-user auth via environment variable password hash.

5. **Bilingual content** — Realtor.ca serves content in French and English depending on user settings. Selectors should work for both languages where possible.
